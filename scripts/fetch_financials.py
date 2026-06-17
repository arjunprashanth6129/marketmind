"""Scrape screener.in for annual financials of all 35 stocks.

Caches raw HTML to scripts/cache/{id}.html (so re-runs don't re-fetch). Parses
the Profit & Loss, Balance Sheet, Cash Flow and Shareholding tables and writes
the raw extracted numbers to data/screener_raw.json for the snapshot-derivation
step to consume.

Screener shows a rolling ~12-year window, so in 2026 only FY2015/16 onward are
typically present. We capture every year column screener exposes; the
build_snapshot step decides FY2010-2016 coverage and logs gaps.

    python scripts/fetch_financials.py
"""
import json, os, re, time, sys
import requests
from bs4 import BeautifulSoup
from stocks import STOCKS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cache")
os.makedirs(DATA, exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

# screener slug overrides where it differs from our app id
SLUG = {"BAJAJAUTO": "BAJAJ-AUTO", "FINOLEXIND": "FINPIPE"}
# stocks whose longest history lives on the STANDALONE page (e.g. Nestle FY-change)
STANDALONE_FIRST = {"NESTLEIND", "ABB", "PAGEIND", "VSTIND"}


def screener_url(sid, consolidated=True):
    slug = SLUG.get(sid, sid)
    suffix = "consolidated/" if consolidated else ""
    return f"https://www.screener.in/company/{slug}/{suffix}"


def get_html(sid):
    """Return cached or freshly fetched HTML, preferring consolidated."""
    path = os.path.join(CACHE, f"{sid}.html")
    if os.path.exists(path) and os.path.getsize(path) > 5000:
        return open(path, encoding="utf-8").read()
    order = (False, True) if sid in STANDALONE_FIRST else (True, False)
    for consolidated in order:
        try:
            r = requests.get(screener_url(sid, consolidated), headers=HEADERS, timeout=25)
            if r.status_code == 200 and "profit-loss" in r.text:
                open(path, "w", encoding="utf-8").write(r.text)
                time.sleep(1.5)
                return r.text
            time.sleep(1.5)
        except Exception as e:
            print(f"    fetch error {sid}: {e}", file=sys.stderr)
            time.sleep(2)
    return None


def num(s):
    """Parse a screener cell into float, handling commas/%/-/blank."""
    if s is None:
        return None
    s = s.replace(",", "").replace("%", "").strip()
    if s in ("", "-", "â\x80\x94", "—"):
        return None
    neg = s.startswith("-")
    s = re.sub(r"[^0-9.]", "", s)
    if s == "":
        return None
    try:
        v = float(s)
        return -v if neg else v
    except ValueError:
        return None


def parse_section(soup, section_id):
    """Return (year_labels, {row_label: [values...]}) for a screener section table."""
    sec = soup.find("section", id=section_id)
    if not sec:
        return [], {}
    table = sec.find("table", class_="data-table")
    if not table:
        return [], {}
    # header years
    head_cells = table.find("thead").find_all("th")
    years = []
    for th in head_cells[1:]:
        txt = th.get_text(strip=True)
        m = re.search(r"(20\d\d)", txt)
        years.append(m.group(1) if m else txt)
    rows = {}
    for tr in table.find("tbody").find_all("tr"):
        cells = tr.find_all("td")
        if not cells:
            continue
        label = cells[0].get_text(strip=True).rstrip("+ ").strip()
        label = re.sub(r"\s+", " ", label)
        vals = [num(td.get_text(strip=True)) for td in cells[1:]]
        rows[label] = vals
    return years, rows


def row_get(rows, *candidates):
    """Case-insensitive fuzzy lookup of a row by candidate label substrings."""
    keys = list(rows.keys())
    for cand in candidates:
        c = cand.lower()
        for k in keys:
            if k.lower() == c:
                return rows[k]
    for cand in candidates:
        c = cand.lower()
        for k in keys:
            if c in k.lower():
                return rows[k]
    return None


def main():
    out = {}
    summary = []
    for i, (sid, yahoo, name, sector) in enumerate(STOCKS, 1):
        print(f"[{i}/{len(STOCKS)}] {sid} ...", flush=True)
        html = get_html(sid)
        if not html:
            print(f"      NO HTML", flush=True)
            out[sid] = {"error": "no_html"}
            summary.append((sid, "NO_HTML"))
            continue
        soup = BeautifulSoup(html, "lxml")

        pl_years, pl = parse_section(soup, "profit-loss")
        bs_years, bs = parse_section(soup, "balance-sheet")
        cf_years, cf = parse_section(soup, "cash-flow")
        sh_years, sh = parse_section(soup, "shareholding")

        def series(rows, years, getter_args):
            r = row_get(rows, *getter_args)
            if r is None:
                return {}
            return {y: v for y, v in zip(years, r) if v is not None}

        rec = {
            "pl_years": pl_years,
            "sales":     series(pl, pl_years, ["Sales", "Revenue", "Total Revenue", "Financing Profit", "Interest"]),
            "net_profit": series(pl, pl_years, ["Net Profit", "Profit after tax"]),
            "eps":       series(pl, pl_years, ["EPS in Rs", "EPS"]),
            "dividend_payout": series(pl, pl_years, ["Dividend Payout %", "Dividend Payout"]),
            "opm":       series(pl, pl_years, ["OPM %", "OPM"]),
            "operating_profit": series(pl, pl_years, ["Operating Profit"]),
            "cfo":       series(cf, cf_years, ["Cash from Operating Activity", "Cash from Operating"]),
            "borrowings": series(bs, bs_years, ["Borrowings"]),
            "equity_capital": series(bs, bs_years, ["Equity Capital", "Share Capital"]),
            "reserves":  series(bs, bs_years, ["Reserves"]),
            "total_liabilities": series(bs, bs_years, ["Total Liabilities"]),
            "promoters": series(sh, sh_years, ["Promoters"]),
            "bs_years": bs_years, "cf_years": cf_years, "sh_years": sh_years,
        }
        out[sid] = rec
        has2016 = "2016" in rec["net_profit"]
        oldest = min((rec["pl_years"] or ["?"]))
        summary.append((sid, f"PLyrs {min(pl_years) if pl_years else '-'}..{max(pl_years) if pl_years else '-'}  2016NP={'Y' if has2016 else 'N'}"))
        print(f"      {summary[-1][1]}", flush=True)
        with open(os.path.join(DATA, "screener_raw.json"), "w") as f:
            json.dump(out, f, indent=0)

    print("\n=== SCREENER PARSE SUMMARY ===")
    for sid, s in summary:
        print(f"{sid:12} {s}")


if __name__ == "__main__":
    main()
