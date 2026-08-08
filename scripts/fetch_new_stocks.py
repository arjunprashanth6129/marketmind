#!/usr/bin/env python3
"""Stage 1 of the universe expansion: gather everything a candidate needs.

For each candidate ticker this collects, into data/_new_pool.json:

  * FY2015-FY2021 revenue / net profit / EPS / CFO      (screener.in)
  * June-2021 balance-sheet and ratio inputs            (screener.in)
  * the company's own About text                        (screener.in)
  * monthly adjusted closes and monthly OHLC            (yfinance, daily-derived)
  * the raw June-2021 close and TTM dividend            (yfinance)

Market cap is computed as

    mcap_cr = raw_jun21_price x equity_capital_cr / face_value

because equity capital and face value are both FY2021 figures, so the implied
share count is the one that actually existed at the anchor. yfinance's
get_shares_full proved unreliable for smaller names - it returned a count ten
times too low for VSTIND, which would have mislabelled a mid cap as a small
cap. Since the brief is half small caps, that had to be right.

Cap thresholds match how the original 50 were labelled:
Large >= 20,000 Cr; Mid 5,000-20,000; Small 500-5,000; Micro < 500.

Nothing here is written into the live data files - selection happens after
reading the report, and merge_new_stocks.py does the writing.

    python3 scripts/fetch_new_stocks.py
"""
import json
import os
import time

import pandas as pd
import requests
import yfinance as yf
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "data", "cache")
OUT = os.path.join(ROOT, "data", "_new_pool.json")

HEAD = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

A21 = pd.Timestamp("2021-06-30")
FIN_YEARS = list(range(2015, 2022))

# Deliberately weighted towards names that were small in 2021 so the final
# selection has enough genuine small caps to draw 25 from.
POOL = [
    # --- expected small ---
    "NEWGEN", "SONATSOFTW", "LUMAXIND", "MINDACORP", "GABRIEL", "JAMNAAUTO",
    "SUPRAJIT", "WHEELS", "HEG", "KIRLOSENG", "CCL", "HERITGFOOD", "BAJAJCON",
    "REPCOHOME", "KARURVYSYA", "DCBBANK", "SOUTHBANK", "ARVIND", "RAYMOND",
    "HIMATSEIDE", "GRAVITA", "NILKAMAL", "GREENPANEL", "APCOTEXIND", "NOCIL",
    "SUDARSCHEM", "SANDESH", "TVSSRICHAK", "ZENTEC", "IFBIND", "FIEMIND",
    "VENKEYS", "POLYMED", "BALAMINES", "MASTEK", "ELGIEQUIP", "PRINCEPIPE",
    "DEEPAKFERT", "UJJIVANSFB", "TTKPRESTIG", "ORIENTELEC", "GALAXYSURF",
    "ROSSARI", "CAPLIPOINT", "FDC", "HAPPSTMNDS", "RALLIS", "GNFC",
    "CHAMBLFERT", "VINATIORGA",
    # --- expected mid / large ---
    "TATAELXSI", "LAURUSLABS", "DEEPAKNTR", "LTTS", "PERSISTENT", "KPITTECH",
    "TANLA", "ROUTE", "INTELLECT", "AJANTPHARM", "NATCOPHARM", "GRANULES",
    "JBCHEPHARM", "ERIS", "IPCALAB", "ALKEM", "TORNTPHARM", "ABBOTINDIA",
    "THERMAX", "AIAENG", "CARBORUNIV", "TIMKEN", "SKFINDIA", "SCHAEFFLER",
    "RATNAMANI", "KEI", "FINPIPE", "APLAPOLLO", "POLYCAB", "FINCABLES",
    "BLUESTARCO", "SYMPHONY", "AMBER", "DIXON", "VGUARD", "CROMPTON",
    "BATAINDIA", "KPRMILL", "TRIDENT", "PAGEIND", "RADICO", "UBL",
    "ZYDUSWELL", "GILLETTE", "VSTIND", "EMAMILTD", "CHOLAFIN", "MANAPPURAM",
    "MUTHOOTFIN", "CANFINHOME", "EQUITASBNK", "CUB", "FEDERALBNK",
    "LICHSGFIN", "SRF", "PIIND", "COROMANDEL", "TATACHEM", "ATUL",
    "NAVINFLUOR", "SUNTV", "INDHOTEL", "JUBLFOOD", "ASTRAZEN", "SANOFI",
    "PGHH", "HONAUT", "3MINDIA", "BOSCHLTD", "ESCORTS", "SUNDRMFAST",
    "ENDURANCE", "BALKRISIND", "TIINDIA", "ALKYLAMINE", "OFSS",
]


# ---------------------------------------------------------------- screener


def num(s):
    if s is None:
        return None
    s = s.replace(",", "").replace("%", "").replace("₹", "").strip()
    if s in ("", "-", ""):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def fetch_html(ticker):
    """Cached screener page. Prefers consolidated, falls back to standalone."""
    os.makedirs(CACHE, exist_ok=True)
    live = False
    fallback = None
    for suffix, tag in (("consolidated/", "cons"), ("", "std")):
        path = os.path.join(CACHE, f"{ticker}_{tag}.html")
        if os.path.exists(path):
            html = open(path, encoding="utf-8").read()
        else:
            try:
                r = requests.get(
                    f"https://www.screener.in/company/{ticker}/{suffix}",
                    headers=HEAD,
                    timeout=40,
                )
            except Exception:
                continue
            live = True
            if r.status_code != 200 or len(r.text) < 5000:
                continue
            open(path, "w", encoding="utf-8").write(r.text)
            html = r.text
        soup = BeautifulSoup(html, "lxml")
        heads, pl = parse_section(soup, "profit-loss")
        if pl and heads and pick_cols(heads)[0]:
            return soup, ("consolidated" if tag == "cons" else "standalone"), live
        if pl and heads and fallback is None:
            fallback = (soup, "consolidated" if tag == "cons" else "standalone")
    if fallback:
        return fallback[0], fallback[1], live
    return None, None, live


def parse_section(soup, secid):
    sec = soup.select_one("#" + secid)
    if not sec:
        return None, None
    t = sec.find("table")
    if not t or not t.find("thead"):
        return None, None
    heads = [th.get_text(strip=True) for th in t.find("thead").find_all("th")]
    rows = {}
    for tr in t.find("tbody").find_all("tr"):
        tds = tr.find_all("td")
        if not tds:
            continue
        lab = tds[0].get_text(strip=True).rstrip("+").strip()
        rows[lab] = {
            heads[j]: tds[j].get_text(strip=True)
            for j in range(1, len(tds))
            if j < len(heads)
        }
    return heads, rows


def pick_cols(heads):
    """(fy2021 column, march-or-december flag)."""
    if "Mar 2021" in heads:
        return "Mar 2021", "Mar"
    if "Dec 2020" in heads:
        return "Dec 2020", "Dec"
    return None, None


def col_for(year, mode):
    return f"Mar {year}" if mode == "Mar" else f"Dec {year - 1}"


def cell(rows, labels, col):
    if rows is None or col is None:
        return None
    for lab in labels:
        for k in rows:
            if k.lower() == lab.lower():
                return num(rows[k].get(col))
    for lab in labels:
        for k in rows:
            if lab.lower() in k.lower():
                return num(rows[k].get(col))
    return None


def shareholding(soup, mode):
    sec = soup.select_one("#shareholding")
    if not sec:
        return None, None
    prefer = ["Jun 2021", "Mar 2021", "Dec 2020", "Sep 2021", "Dec 2021"]
    for t in sec.find_all("table"):
        if not t.find("thead"):
            continue
        heads = [th.get_text(strip=True) for th in t.find("thead").find_all("th")]
        hit = next((c for c in prefer if c in heads), None)
        if not hit:
            continue
        rows = {}
        for tr in t.find("tbody").find_all("tr"):
            tds = tr.find_all("td")
            if not tds:
                continue
            lab = tds[0].get_text(strip=True).rstrip("+").strip()
            rows[lab] = {
                heads[j]: tds[j].get_text(strip=True)
                for j in range(1, len(tds))
                if j < len(heads)
            }
        return rows, hit
    return None, None


def about_text(soup):
    """The company's own description, used as the basis for the blurb."""
    for sel in (".company-profile .about p", "#company-info p", ".about p"):
        el = soup.select_one(sel)
        if el:
            txt = " ".join(el.get_text(" ", strip=True).split())
            if len(txt) > 40:
                return txt[:600]
    return None


# ---------------------------------------------------------------- yfinance


def price_data(ticker):
    sym = ticker + ".NS"
    daily = yf.download(
        sym, start="1999-12-01", end="2026-06-19",
        interval="1d", auto_adjust=True, progress=False, threads=False,
    )
    raw = yf.download(
        sym, start="2021-05-20", end="2021-08-10",
        interval="1d", auto_adjust=False, progress=False, threads=False,
    )
    if daily is None or daily.empty or raw is None or raw.empty:
        return None
    if isinstance(daily.columns, pd.MultiIndex):
        daily.columns = daily.columns.get_level_values(0)
    if isinstance(raw.columns, pd.MultiIndex):
        raw.columns = raw.columns.get_level_values(0)

    d = daily[["Open", "High", "Low", "Close"]].dropna()
    if d.empty:
        return None

    g = d.groupby([d.index.year, d.index.month])
    prices, ohlc = [], []
    for (y, m), chunk in g:
        date = f"{int(y):04d}-{int(m):02d}-01"
        prices.append({"date": date, "close": round(float(chunk["Close"].iloc[-1]), 2)})
        ohlc.append({
            "date": date,
            "o": round(float(chunk["Open"].iloc[0]), 2),
            "h": round(float(chunk["High"].max()), 2),
            "l": round(float(chunk["Low"].min()), 2),
            "c": round(float(chunk["Close"].iloc[-1]), 2),
        })

    cr = raw["Close"].dropna()
    pos = (cr.index - A21).to_series().abs().values.argmin()
    raw21 = round(float(cr.iloc[pos]), 2)

    ttm_div = None
    try:
        dv = yf.Ticker(sym).dividends
        if dv is not None and not dv.empty:
            idx = dv.index.tz_localize(None)
            mask = (idx >= pd.Timestamp("2020-07-01")) & (idx <= A21)
            if mask.any():
                ttm_div = round(float(dv[mask].sum()), 4)
    except Exception:
        pass

    return {
        "prices": prices,
        "ohlc": ohlc,
        "raw21": raw21,
        "ttm_div": ttm_div,
        "first": str(d.index.min().date()),
        "last": str(d.index.max().date()),
    }


# ---------------------------------------------------------------- main


def main() -> int:
    pool = {}
    for i, t in enumerate(POOL, 1):
        rec = {"ticker": t}
        soup, view, live = fetch_html(t)
        if soup is None:
            rec["status"] = "NO SCREENER PAGE"
            pool[t] = rec
            print(f"{i:3} {t:12} NO SCREENER PAGE", flush=True)
            if live:
                time.sleep(2)
            continue

        heads, pl = parse_section(soup, "profit-loss")
        fy_col, mode = pick_cols(heads or [])
        _, bs = parse_section(soup, "balance-sheet")
        _, cf = parse_section(soup, "cash-flow")
        sh, sh_col = shareholding(soup, mode)

        rec["view"] = view
        rec["fy_col"] = fy_col
        rec["mode"] = mode
        h1 = soup.find("h1")
        rec["screener_name"] = h1.get_text(strip=True) if h1 else None
        rec["about"] = about_text(soup)

        top = {}
        tr = soup.select_one("#top-ratios")
        if tr:
            for li in tr.find_all("li"):
                n, v = li.select_one(".name"), li.select_one(".value")
                if n and v:
                    top[n.get_text(strip=True)] = " ".join(v.get_text(strip=True).split())
        rec["face_value"] = num(top.get("Face Value"))

        if fy_col:
            rec["equity_capital_2021"] = cell(bs, ["Equity Capital"], fy_col)
            rec["reserves_2021"] = cell(bs, ["Reserves"], fy_col)
            rec["borrowings_2021"] = cell(bs, ["Borrowings", "Borrowing"], fy_col)
            rec["opm_2021"] = cell(pl, ["OPM %", "OPM"], fy_col)
            rec["eps_2021"] = cell(pl, ["EPS in Rs", "EPS"], fy_col)
            rec["np_2021"] = cell(pl, ["Net Profit"], fy_col)
            fins = {}
            for y in FIN_YEARS:
                c = col_for(y, mode)
                fins[f"FY{y}"] = {
                    "revenue": cell(pl, ["Sales", "Revenue"], c),
                    "netProfit": cell(pl, ["Net Profit"], c),
                    "eps": cell(pl, ["EPS in Rs", "EPS"], c),
                    "cfo": cell(cf, ["Cash from Operating Activity"], c),
                }
            rec["financials"] = fins
        rec["promoter_2021"] = cell(sh, ["Promoters"], sh_col) if sh else None
        rec["sh_col"] = sh_col

        px = price_data(t)
        if px is None:
            rec["status"] = "NO PRICES"
            pool[t] = rec
            print(f"{i:3} {t:12} NO PRICES", flush=True)
            if live:
                time.sleep(2)
            continue
        rec.update(px)

        eq = rec.get("equity_capital_2021")
        fv = rec.get("face_value")
        if eq and fv:
            mcap = rec["raw21"] * eq / fv
            rec["mcap_cr"] = round(mcap)
            rec["cat"] = ("Large" if mcap >= 20000 else
                          "Mid" if mcap >= 5000 else
                          "Small" if mcap >= 500 else "Micro")
            rec["status"] = "OK"
        else:
            rec["status"] = "NO MCAP INPUTS"

        pool[t] = rec
        print(
            f"{i:3} {t:12} {rec['status']:14} cat={rec.get('cat','-'):6} "
            f"mcap={rec.get('mcap_cr','-'):>8} raw21={rec.get('raw21','-'):>9} "
            f"months={len(rec.get('prices',[])):4} first={rec.get('first','-')}",
            flush=True,
        )
        if live:
            time.sleep(2)

    json.dump(pool, open(OUT, "w"), separators=(",", ":"))
    ok = [r for r in pool.values() if r.get("status") == "OK"]
    print(f"\nusable {len(ok)} / {len(POOL)}")
    for cat in ("Large", "Mid", "Small", "Micro"):
        names = sorted(r["ticker"] for r in ok if r.get("cat") == cat)
        print(f"{cat:6} {len(names):3}  {', '.join(names)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
