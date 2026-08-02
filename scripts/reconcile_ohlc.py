#!/usr/bin/env python3
"""Anchor OHLC bars to the authoritative closes in data/prices.json.

Why this step exists
--------------------
data/prices.json is the single source of truth for every price the app quotes:
snapshot ratios, entry and exit prices, returns and scores all derive from it,
and it has already been verified and outlier-repaired.

The OHLC pull is a separate yfinance request, and its dividend back-adjustment
lands slightly differently - 13 of 47 tickers close up to 2.6% away from the
stored close at the June-2021 anchor. Left alone, a candle would contradict the
price printed in the page header a few centimetres above it.

So we keep the *shape* of each real bar (its open/high/low expressed as ratios
to that bar's own close, which is genuine intra-month range information from
daily highs and lows) and re-anchor it to the authoritative close:

    o = close_authoritative * (o_real / c_real)      ... and likewise h, l

The candle body and wick stay real; the closing price stays consistent with
everything else in the app. Months absent from prices.json are dropped, so the
two series always line up.

    python3 scripts/reconcile_ohlc.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRICES = ROOT / "data" / "prices.json"
NIFTY = ROOT / "data" / "nifty.json"
OHLC = ROOT / "data" / "ohlc.json"

NIFTY_KEY = "__NIFTY__"


def reconcile(bars: list[dict], closes: dict[str, float]) -> list[dict]:
    out = []
    for bar in bars:
        truth = closes.get(bar["date"])
        real_close = bar["c"]
        if truth is None or not real_close:
            continue
        scale = truth / real_close
        o = round(bar["o"] * scale, 2)
        h = round(bar["h"] * scale, 2)
        l = round(bar["l"] * scale, 2)
        # Rounding can nudge a wick inside the body; clamp so high/low always
        # bound both open and close, which the renderer assumes.
        h = max(h, o, truth)
        l = min(l, o, truth)
        out.append({"date": bar["date"], "o": o, "h": h, "l": l, "c": truth})
    return out


def main() -> int:
    prices = json.loads(PRICES.read_text())
    nifty = json.loads(NIFTY.read_text())
    ohlc = json.loads(OHLC.read_text())

    fixed: dict[str, list[dict]] = {}
    for ticker, bars in ohlc.items():
        if ticker == NIFTY_KEY:
            closes = {p["date"]: p["close"] for p in nifty}
        else:
            if ticker not in prices:
                continue
            closes = {p["date"]: p["close"] for p in prices[ticker]}
        rec = reconcile(bars, closes)
        if rec:
            fixed[ticker] = rec

    OHLC.write_text(json.dumps(fixed, separators=(",", ":")))

    # Verify: every candle close must now equal the stored close exactly.
    bad = 0
    for ticker, bars in fixed.items():
        closes = (
            {p["date"]: p["close"] for p in nifty}
            if ticker == NIFTY_KEY
            else {p["date"]: p["close"] for p in prices[ticker]}
        )
        for b in bars:
            if closes.get(b["date"]) != b["c"]:
                bad += 1
            if not (b["l"] <= b["o"] <= b["h"] and b["l"] <= b["c"] <= b["h"]):
                bad += 1

    print(f"Reconciled {len(fixed)} series, {sum(len(v) for v in fixed.values())} bars")
    print(f"Integrity violations: {bad}")
    print(f"Wrote {OHLC.relative_to(ROOT)}")
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
