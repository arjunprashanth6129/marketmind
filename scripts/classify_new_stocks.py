#!/usr/bin/env python3
"""Recompute June-2021 market caps for the candidate pool, and classify.

Getting this right matters because the brief is "half of them were small caps
in 2021", so the label decides the selection.

Method
------
    shares_now = screener Market Cap (today) / screener Current Price (today)
    mcap_2021  = split-adjusted June-2021 close x shares_now

yfinance's non-dividend-adjusted close is already restated for every split and
bonus since, so it is quoted on the same per-share basis as today's share
count. Multiplying the two therefore reconstructs the market cap as it stood in
June 2021, without needing to know what the corporate actions were.

Two methods that looked simpler were rejected:

  * shares from `get_shares_full` - returned a count ten times too low for
    VSTIND, which would have labelled a mid cap as small.
  * net profit / EPS - exact for most, but wrong for holding companies where
    consolidated profit includes minority interest that EPS excludes
    (Bajaj Finserv came out 64% high).

The same weakness the original pipeline had - a split factor that captured
splits but not bonus issues - is why data/snapshot-2021.json currently carries
a market cap of 72,506 Cr for Bajaj Finance against a true figure nearer
3.6 lakh Cr. This method does not have that failure mode.

Where a company raised or merged equity after 2021, today's share count is not
the 2021 count rebased, so the result is overstated. Those show up as a large
disagreement against equity capital / face value and get flagged for review.

    python3 scripts/classify_new_stocks.py
"""
import json
import os
import re

from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "data", "cache")
POOL = os.path.join(ROOT, "data", "_new_pool.json")

LARGE, MID, SMALL = 20000, 5000, 500


def num(s):
    if s is None:
        return None
    s = re.sub(r"[^\d.\-]", "", s.replace(",", ""))
    try:
        return float(s)
    except ValueError:
        return None


def top_ratios(ticker, view):
    order = ["cons", "std"] if view == "consolidated" else ["std", "cons"]
    for tag in order:
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


def main() -> int:
    pool = json.load(open(POOL))
    rows = []
    for t, r in pool.items():
        if r.get("status") != "OK" or not r.get("raw21"):
            continue
        top = top_ratios(t, r.get("view", "consolidated"))
        mcap_now = num(top.get("Market Cap"))
        price_now = num(top.get("Current Price"))
        if not mcap_now or not price_now:
            r["cat"] = None
            continue

        shares_now = mcap_now / price_now          # Cr shares
        mcap21 = r["raw21"] * shares_now           # Cr
        r["shares_now_cr"] = round(shares_now, 2)
        r["mcap_cr"] = round(mcap21)
        r["cat"] = ("Large" if mcap21 >= LARGE else
                    "Mid" if mcap21 >= MID else
                    "Small" if mcap21 >= SMALL else "Micro")

        eq, fv = r.get("equity_capital_2021"), r.get("face_value")
        alt = (eq / fv) if (eq and fv) else None
        r["shares_eqfv_cr"] = round(alt, 2) if alt else None
        # A big gap means the share base changed for a reason other than a
        # split or bonus - a raise or a merger - so the reconstruction leaks.
        r["share_gap_pct"] = (
            round((shares_now - alt) / alt * 100, 1) if alt else None
        )
        rows.append(r)

    json.dump(pool, open(POOL, "w"), separators=(",", ":"))

    rows.sort(key=lambda x: x["mcap_cr"])
    print(f"{'ticker':12} {'cat':6} {'mcap_cr':>9} {'raw21':>9} "
          f"{'sh_now':>8} {'sh_eq/fv':>9} {'gap%':>7}")
    for r in rows:
        flag = ""
        g = r.get("share_gap_pct")
        if g is not None and abs(g) > 25:
            flag = "  <-- share base changed, review"
        print(f"{r['ticker']:12} {r['cat']:6} {r['mcap_cr']:>9} {r['raw21']:>9} "
              f"{r.get('shares_now_cr','-'):>8} {r.get('shares_eqfv_cr','-'):>9} "
              f"{g if g is not None else '-':>7}{flag}")

    print()
    for cat in ("Large", "Mid", "Small", "Micro"):
        names = sorted(r["ticker"] for r in rows if r["cat"] == cat)
        print(f"{cat:6} {len(names):3}  {', '.join(names)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
