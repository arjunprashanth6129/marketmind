#!/usr/bin/env python3
"""Correct the June-2021 market caps that the split-factor bug got wrong.

The bug
-------
scripts/build_snapshot.py computed

    mcap = raw_jun21_close x split_factor x shares_jun21

with `split_factor` taken from yfinance's splits feed. That feed records splits
but not every bonus issue, so a company that did both had its price only partly
un-adjusted and its market cap understated by the missing multiple.

Finding the ones actually affected
----------------------------------
For each stock compare the share count the old method implied against today's
actual count:

    implied   = shares_jun21 x split_factor
    shares_now = screener Market Cap (today) / Current Price (today)
    ratio      = shares_now / implied

`ratio` near 1 means the split factor was complete and the stored figure is
sound. A ratio sitting on a clean integer of 2 or more means a corporate action
the factor missed, and the stored figure is wrong by exactly that integer.
Anything else - a messy, non-integer ratio - is ordinary share issuance
(a merger, a QIP), where today's count is not the 2021 count rebased and the
old figure is the better one.

That distinction matters. Reliance Power's ratio is 1.47 with no split at all,
which is pure issuance: "correcting" it would have wrongly promoted a genuine
small cap to mid and moved every score that touched it. Gujarat Gas, Biocon,
Ambuja and HDFC Bank are the same story.

Applying that rule, exactly two stocks are wrong:

    BAJFINANCE   72,506 Cr -> 374,469 Cr   (factor caught 2 of 10)
    BAJAJFINSV   96,411 Cr -> 193,856 Cr   (factor caught 5 of 10)

Both stay Large, so no cap category and therefore no portfolio score changes.

    python3 scripts/fix_market_caps.py [--apply]
"""
import argparse
import json
import os
import re

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")
CACHE = os.path.join(D, "cache")

LARGE, MID, SMALL = 20000, 5000, 500
# How close the residual ratio must sit to a whole number before we accept it
# as a missed split or bonus rather than share issuance.
INTEGER_TOLERANCE = 0.06


def num(s):
    if s is None:
        return None
    s = re.sub(r"[^\d.\-]", "", s.replace(",", ""))
    try:
        return float(s)
    except ValueError:
        return None


def top_ratios(ticker):
    for tag in ("cons", "std"):
        path = os.path.join(CACHE, f"{ticker}_{tag}.html")
        if not os.path.exists(path):
            continue
        soup = BeautifulSoup(open(path, encoding="utf-8").read(), "lxml")
        tr = soup.select_one("#top-ratios")
        if not tr:
            continue
        out = {}
        for li in tr.find_all("li"):
            n, v = li.select_one(".name"), li.select_one(".value")
            if n and v:
                out[n.get_text(strip=True)] = " ".join(v.get_text(strip=True).split())
        if out:
            return out
    return {}


def categorise(m):
    return ("Large" if m >= LARGE else
            "Mid" if m >= MID else
            "Small" if m >= SMALL else "Micro")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    snap = json.loads(open(os.path.join(D, "snapshot-2021.json")).read())
    yf = json.loads(open(os.path.join(D, "yf.json")).read())

    fixes, examined = [], []
    for t, y in sorted(yf.items()):
        if t not in snap:
            continue
        shares = y.get("shares_2021")
        raw21 = y.get("raw_2021")
        factor = y.get("split_factor_after_jun2021") or 1
        if not (shares and raw21):
            continue
        top = top_ratios(t)
        mcap_now, price_now = num(top.get("Market Cap")), num(top.get("Current Price"))
        if not (mcap_now and price_now):
            continue

        implied = shares / 1e7 * factor
        shares_now = mcap_now / price_now
        ratio = shares_now / implied
        nearest = round(ratio)
        off = abs(ratio - nearest) / nearest if nearest else 1

        examined.append((t, factor, ratio))
        # Only a clean multiple of 2 or more is a missed corporate action.
        if nearest >= 2 and off <= INTEGER_TOLERANCE:
            new = round(raw21 * shares_now)
            fixes.append({
                "t": t,
                "old": snap[t]["marketCap"],
                "new": new,
                "old_cat": snap[t]["marketCapCategory"],
                "new_cat": categorise(new),
                "missed": nearest,
                "factor": factor,
            })

    print(f"examined {len(examined)} stocks with a June-2021 share count\n")
    print(f"{'ticker':12} {'stored':>10} {'corrected':>10} {'missed':>7}  category")
    for f in fixes:
        cat = (f"{f['old_cat']} -> {f['new_cat']}"
               if f["old_cat"] != f["new_cat"] else f["old_cat"] + " (unchanged)")
        print(f"{f['t']:12} {f['old']:>10} {f['new']:>10} {f['missed']:>6}x  {cat}")

    moved = [f for f in fixes if f["old_cat"] != f["new_cat"]]
    print(f"\n{len(fixes)} market caps corrected; "
          f"{len(moved)} change cap category (score-affecting)")

    if not args.apply:
        print("\nDry run - nothing written. Re-run with --apply.")
        return 0

    for f in fixes:
        snap[f["t"]]["marketCap"] = f["new"]
        snap[f["t"]]["marketCapCategory"] = f["new_cat"]
    json.dump(snap, open(os.path.join(D, "snapshot-2021.json"), "w"), indent=1)
    print(f"\nwrote data/snapshot-2021.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
