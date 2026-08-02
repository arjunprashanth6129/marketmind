#!/usr/bin/env python3
"""Real monthly OHLC bars for the 50-stock universe + the Nifty 50.

Why daily -> monthly instead of interval="1mo"
----------------------------------------------
Yahoo's monthly endpoint returns corrupt closes for a handful of months (see
scripts/fix_price_outliers.py: HDFCBANK 2006-04 came back as 139.23 against
~32 either side). Its daily series is clean, so every monthly bar here is
aggregated from daily auto-adjusted bars:

    open  = first trading day's open
    high  = max of daily highs
    low   = min of daily lows
    close = last trading day's close

That sidesteps the bad endpoint entirely and keeps closes consistent with the
already-repaired data/prices.json.

Output: data/ohlc.json as {ticker: [{date, o, h, l, c}]} with short keys, since
this file is imported into the client bundle.

    python3 scripts/fetch_ohlc.py
"""
import json
import sys
import time
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
PRICES = ROOT / "data" / "prices.json"
OUT = ROOT / "data" / "ohlc.json"

START = "1999-12-01"
END = "2026-06-19"


def monthly_ohlc(symbol: str) -> list[dict]:
    """Monthly OHLC bars aggregated from daily auto-adjusted data."""
    df = yf.download(
        symbol,
        start=START,
        end=END,
        interval="1d",
        auto_adjust=True,
        progress=False,
        threads=False,
    )
    if df is None or df.empty:
        return []

    # yfinance returns a MultiIndex column frame for single tickers in some
    # versions; flatten to plain OHLC columns.
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    need = ["Open", "High", "Low", "Close"]
    if not all(c in df.columns for c in need):
        return []
    df = df[need].dropna()
    if df.empty:
        return []

    grouped = df.groupby([df.index.year, df.index.month])
    bars = []
    for (year, month), chunk in grouped:
        bars.append(
            {
                "date": f"{int(year):04d}-{int(month):02d}-01",
                "o": round(float(chunk["Open"].iloc[0]), 2),
                "h": round(float(chunk["High"].max()), 2),
                "l": round(float(chunk["Low"].min()), 2),
                "c": round(float(chunk["Close"].iloc[-1]), 2),
            }
        )
    return bars


def main() -> int:
    prices = json.loads(PRICES.read_text())
    tickers = sorted(prices)

    out: dict[str, list[dict]] = {}
    missing: list[str] = []

    for i, ticker in enumerate(tickers, 1):
        bars = monthly_ohlc(ticker + ".NS")
        if not bars:
            missing.append(ticker)
            print(f"{i:3} {ticker:12} NO DAILY DATA")
            continue
        out[ticker] = bars
        anchor = next((b for b in bars if b["date"] == "2021-06-01"), None)
        print(
            f"{i:3} {ticker:12} n={len(bars):4} "
            f"jun21_close={anchor['c'] if anchor else '-'}"
        )
        time.sleep(0.35)

    nifty = monthly_ohlc("^NSEI")
    if nifty:
        out["__NIFTY__"] = nifty
        print(f"    NIFTY        n={len(nifty)}")

    OUT.write_text(json.dumps(out, separators=(",", ":")))
    print(f"\nWrote {OUT.relative_to(ROOT)}  tickers={len(out)}")
    if missing:
        print(f"No OHLC for (delisted): {', '.join(missing)}")
        print("These fall back to the line chart in the UI.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
