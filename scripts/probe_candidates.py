#!/usr/bin/env python3
"""Probe candidate NSE tickers for the universe expansion.

Reports, per candidate, the June-2021 market cap (raw close x shares
outstanding at the time) and whether the ticker has usable history across the
whole window. Cap thresholds match the ones the existing 50 were classified
with (see data/snapshot-2021.json):

    Large  >= 20,000 Cr
    Mid      5,000 - 20,000 Cr
    Small      500 - 5,000 Cr
    Micro    <    500 Cr

Selection is made from this output rather than from memory, so the "half were
small caps in 2021" split is grounded in the data.

    python3 scripts/probe_candidates.py > /tmp/candidates.txt
"""
import json
import sys
import time

import pandas as pd
import yfinance as yf

A21 = pd.Timestamp("2021-06-30")

CANDIDATES = [
    # --- likely small (< 5,000 Cr in Jun 2021) ---
    "BALAMINES", "NEWGEN", "MASTEK", "SONATSOFTW", "HAPPSTMNDS", "POLYMED",
    "SHAILY", "FIEMIND", "LUMAXIND", "MINDACORP", "GABRIEL", "JAMNAAUTO",
    "SUPRAJIT", "WHEELS", "HEG", "ELGIEQUIP", "KIRLOSENG", "CCL", "VENKEYS",
    "HERITGFOOD", "BAJAJCON", "REPCOHOME", "UJJIVANSFB", "KARURVYSYA",
    "DCBBANK", "SOUTHBANK", "J&KBANK", "ARVIND", "RAYMOND", "HIMATSEIDE",
    "CRAFTSMAN", "PRINCEPIPE", "CAPLIPOINT", "FDC", "GRAVITA", "TIINDIA",
    "RALLIS", "NILKAMAL", "CYIENTDLM", "ORIENTELEC", "GREENPANEL",
    "STYLAMIND", "APCOTEXIND", "DEEPAKFERT", "GNFC", "CHAMBLFERT", "NOCIL",
    "SUDARSCHEM", "VINATIORGA", "ROSSARI", "GALAXYSURF", "JUBLINGREA",
    "TATAINVEST", "MAHSCOOTER", "SANDESH", "TVSSRICHAK", "ZENTEC",
    "BEML", "IFBIND", "TTKPRESTIG",
    # --- likely mid / large ---
    "TATAELXSI", "LAURUSLABS", "DEEPAKNTR", "ALKYLAMINE", "PERSISTENT",
    "LTTS", "MINDTREE", "OFSS", "TANLA", "ROUTE", "INTELLECT", "KPITTECH",
    "AJANTPHARM", "NATCOPHARM", "GRANULES", "JBCHEPHARM", "ERIS", "IPCALAB",
    "ALKEM", "TORNTPHARM", "ABBOTINDIA", "PFIZER", "GLAXO",
    "THERMAX", "AIAENG", "CARBORUNIV", "TIMKEN", "SKFINDIA", "SCHAEFFLER",
    "RATNAMANI", "KEI", "FINPIPE", "APLAPOLLO", "POLYCAB", "FINCABLES",
    "BLUESTARCO", "SYMPHONY", "AMBER", "DIXON", "VGUARD", "CROMPTON",
    "BATAINDIA", "KPRMILL", "TRIDENT", "WELSPUNIND", "PAGEIND",
    "RADICO", "UBL", "ZYDUSWELL", "GILLETTE", "VSTIND", "EMAMILTD",
    "CHOLAFIN", "MANAPPURAM", "MUTHOOTFIN", "CANFINHOME", "EQUITASBNK",
    "CUB", "RBLBANK", "FEDERALBNK", "INDIANB", "LICHSGFIN",
    "SRF", "PIIND", "COROMANDEL", "UPL", "TATACHEM", "ATUL", "NAVINFLUOR",
    "SUNTV", "PVRINOX", "INDHOTEL", "JUBLFOOD", "DEVYANI", "WESTLIFE",
    "ASTRAZEN", "SANOFI", "PGHH", "HONAUT", "3MINDIA", "BOSCHLTD",
    "ESCORTS", "SUNDRMFAST", "ENDURANCE", "MOTHERSON", "BALKRISIND",
]


def probe(t: str) -> dict:
    sym = t + ".NS"
    row = {"ticker": t}
    try:
        adj = yf.download(sym, start="1999-12-01", end="2026-06-19",
                          auto_adjust=True, progress=False, threads=False)
        raw = yf.download(sym, start="2021-05-20", end="2021-08-10",
                          auto_adjust=False, progress=False, threads=False)
        if adj is None or adj.empty or raw is None or raw.empty:
            row["status"] = "NO DATA"
            return row
        ca = adj["Close"]
        if isinstance(ca, pd.DataFrame):
            ca = ca.iloc[:, 0]
        ca = ca.dropna()
        cr = raw["Close"]
        if isinstance(cr, pd.DataFrame):
            cr = cr.iloc[:, 0]
        cr = cr.dropna()
        if ca.empty or cr.empty:
            row["status"] = "NO DATA"
            return row

        row["first"] = str(ca.index.min().date())
        row["last"] = str(ca.index.max().date())
        # Must be listed well before the anchor and still trading at the end.
        if ca.index.min() > pd.Timestamp("2021-01-01"):
            row["status"] = "TOO NEW"
            return row
        if ca.index.max() < pd.Timestamp("2026-05-01"):
            row["status"] = "STOPS EARLY"
            return row

        pos = (cr.index - A21).to_series().abs().values.argmin()
        raw21 = float(cr.iloc[pos])
        pos = (ca.index - A21).to_series().abs().values.argmin()
        adj21 = float(ca.iloc[pos])
        adj26 = float(ca.iloc[-1])
        row["raw21"] = round(raw21, 2)
        row["ret"] = round((adj26 - adj21) / adj21 * 100, 1)

        shares = None
        try:
            sh = yf.Ticker(sym).get_shares_full(start="2021-01-01", end="2021-12-31")
            if sh is not None and not sh.empty:
                idx = sh.index.tz_localize(None)
                p = (idx - A21).to_series().abs().values.argmin()
                shares = float(sh.iloc[p])
        except Exception:
            pass
        if shares:
            mcap = raw21 * shares / 1e7
            row["mcap"] = round(mcap)
            row["cat"] = ("Large" if mcap >= 20000 else
                          "Mid" if mcap >= 5000 else
                          "Small" if mcap >= 500 else "Micro")
            row["status"] = "OK"
        else:
            row["status"] = "NO SHARES"
    except Exception as e:
        row["status"] = f"ERR {type(e).__name__}"
    return row


def main() -> int:
    results = []
    for i, t in enumerate(CANDIDATES, 1):
        r = probe(t)
        results.append(r)
        print(
            f"{i:3} {t:12} {r.get('status',''):10} "
            f"mcap={r.get('mcap','-'):>8} cat={r.get('cat','-'):6} "
            f"ret={r.get('ret','-'):>8} first={r.get('first','-')}",
            flush=True,
        )
        time.sleep(0.25)
    json.dump(results, open("/tmp/candidates.json", "w"), indent=1)
    ok = [r for r in results if r.get("status") == "OK"]
    print(f"\nusable: {len(ok)} / {len(CANDIDATES)}", file=sys.stderr)
    for cat in ("Large", "Mid", "Small", "Micro"):
        n = [r["ticker"] for r in ok if r.get("cat") == cat]
        print(f"{cat}: {len(n)} -> {', '.join(n)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
