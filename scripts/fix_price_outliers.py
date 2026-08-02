#!/usr/bin/env python3
"""Repair corrupt monthly closes in data/prices.json.

Background
----------
`fetch_prices.py` pulls monthly bars with `interval="1mo"`. For a handful of
months Yahoo's *monthly* series returns a value several times the real price
(HDFCBANK 2006-04 = 139.23 against ~32 either side, WIPRO 2006-04 = 253.36
against ~48). Yahoo's *daily* series for those same months is clean, so the
fault is in the monthly aggregation upstream, not in our pipeline and not in
the corporate-action adjustment.

A single 4x spike rescales the whole y-axis, which is what makes the long-term
screener charts look wrong.

Method
------
For every ticker, re-derive each month's close from daily auto-adjusted data
(the month's last trading-day close) and compare against the stored monthly
value. Rewrite a month only when the two disagree by more than TOL, which
leaves genuine corporate actions and real crashes (e.g. ADANIGREEN's Feb-2023
Hindenburg decline) untouched, since daily and monthly agree there.

Run with --dry-run first to review the diff.

    python3 scripts/fix_price_outliers.py --dry-run
    python3 scripts/fix_price_outliers.py
"""
import argparse
import json
import sys
import time
from pathlib import Path

import pandas as pd
import yfinance as yf

ROOT = Path(__file__).resolve().parent.parent
PRICES = ROOT / "data" / "prices.json"
NIFTY = ROOT / "data" / "nifty.json"

START = "1999-12-01"
END = "2026-06-19"
# Relative disagreement between the stored monthly close and the daily-derived
# close above which we treat the stored value as corrupt. The two series can
# legitimately differ by ~10% on thinly traded months (month-end timing and
# Yahoo's own rounding), while the corruption we are repairing is 2x-5x, so a
# 35% threshold separates them cleanly without rewriting valid history.
TOL = 0.35

# Delisted tickers have no daily series to check against. For those we fall
# back to detecting a single-month spike that reverts immediately - a shape no
# real corporate action produces - and interpolate across it.
SPIKE_UP = 1.8
SPIKE_DOWN = 1 / 1.8


def daily_monthly_closes(symbol: str) -> dict[str, float]:
    """Month-end adjusted closes derived from daily bars: {'YYYY-MM-01': close}."""
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
        return {}
    close = df["Close"]
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]
    close = close.dropna()
    if close.empty:
        return {}
    # Last trading day of each calendar month.
    monthly = close.groupby([close.index.year, close.index.month]).last()
    return {
        f"{int(y):04d}-{int(m):02d}-01": round(float(v), 2)
        for (y, m), v in monthly.items()
    }


def repair(series: list[dict], truth: dict[str, float]) -> tuple[list[dict], list[tuple]]:
    """Return (repaired series, list of (date, old, new)) for changed months."""
    fixed, changes = [], []
    for point in series:
        date, old = point["date"], point["close"]
        new = truth.get(date)
        if new is not None and old and abs(new - old) / old > TOL:
            changes.append((date, old, new))
            fixed.append({"date": date, "close": new})
        else:
            fixed.append(point)
    return fixed, changes


def repair_by_shape(series: list[dict]) -> tuple[list[dict], list[tuple]]:
    """Fallback for delisted tickers with no daily series to compare against.

    Only repairs a month that spikes away from *both* neighbours and reverts
    immediately. A split, bonus or genuine crash moves the price and leaves it
    moved, so this shape is unique to a bad data point. The replacement is the
    geometric mean of the two neighbours, which suits price series better than
    an arithmetic mean.
    """
    fixed = [dict(p) for p in series]
    changes = []
    for i in range(1, len(fixed) - 1):
        a, b, c = fixed[i - 1]["close"], fixed[i]["close"], fixed[i + 1]["close"]
        if not (a and b and c):
            continue
        r1, r2 = b / a, c / b
        spiked_up = r1 >= SPIKE_UP and r2 <= SPIKE_DOWN
        spiked_down = r1 <= SPIKE_DOWN and r2 >= SPIKE_UP
        if spiked_up or spiked_down:
            new = round((a * c) ** 0.5, 2)
            changes.append((fixed[i]["date"], b, new))
            fixed[i]["close"] = new
    return fixed, changes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="report without writing")
    ap.add_argument("--only", help="comma-separated tickers to check")
    args = ap.parse_args()

    prices = json.loads(PRICES.read_text())
    tickers = (
        [t.strip() for t in args.only.split(",")] if args.only else sorted(prices)
    )

    total_changes = 0
    for i, ticker in enumerate(tickers, 1):
        if ticker not in prices:
            print(f"  ! {ticker} not in prices.json", file=sys.stderr)
            continue
        truth = daily_monthly_closes(ticker + ".NS")
        if truth:
            fixed, changes = repair(prices[ticker], truth)
        else:
            # Delisted: no daily reference, fall back to shape detection.
            fixed, changes = repair_by_shape(prices[ticker])
            if changes:
                print(f"{i:3} {ticker:12} no daily data - repaired by shape")
        prices[ticker] = fixed
        total_changes += len(changes)
        flag = f"{len(changes)} fixed" if changes else "ok"
        print(f"{i:3} {ticker:12} {flag}")
        for date, old, new in changes:
            print(f"        {date}  {old:>10.2f} -> {new:>10.2f}")
        time.sleep(0.4)  # be polite to the API

    # The benchmark matters as much as the stocks: every score is graded
    # against it, so repair it on the same terms.
    nifty = json.loads(NIFTY.read_text())
    truth = daily_monthly_closes("^NSEI")
    nifty_changes: list[tuple] = []
    if truth:
        nifty, nifty_changes = repair(nifty, truth)
        total_changes += len(nifty_changes)
        print(f"\nNIFTY  {len(nifty_changes) or 'no'} fixed")
        for date, old, new in nifty_changes:
            print(f"        {date}  {old:>10.2f} -> {new:>10.2f}")

    print(f"\nTotal months repaired: {total_changes}")

    if args.dry_run:
        print("Dry run - nothing written.")
        return 0

    if total_changes:
        PRICES.write_text(json.dumps(prices, separators=(",", ":")))
        NIFTY.write_text(json.dumps(nifty, separators=(",", ":")))
        print(f"Wrote {PRICES.relative_to(ROOT)} and {NIFTY.relative_to(ROOT)}")
    else:
        print("Nothing to write.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
