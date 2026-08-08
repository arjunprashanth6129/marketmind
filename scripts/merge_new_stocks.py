#!/usr/bin/env python3
"""Stage 2 of the universe expansion: merge the selected 50 into the data layer.

Reads data/_new_pool.json (written by fetch_new_stocks.py, classified by
classify_new_stocks.py) and writes the 50 selected tickers into

    data/prices.json          monthly adjusted closes
    data/ohlc.json            monthly OHLC bars
    data/financials.json      FY2015-FY2021
    data/snapshot-2021.json   the June-2021 ratio snapshot

Snapshot fields use the same formulas as scripts/build_snapshot.py so the new
entries are computed the way the original 50 were. Existing entries are never
touched: the script asserts every pre-existing record is byte-identical
afterwards, because the original 50 have already been verified and
outlier-repaired and must not silently move.

Monthly closes are aggregated from daily bars, which is the method
scripts/fix_price_outliers.py had to retrofit onto the original 50 after
Yahoo's monthly endpoint returned corrupt values, so the new series do not
need that repair. OHLC closes come from the same aggregation as the prices,
so they already satisfy the invariant reconcile_ohlc.py enforces.

    python3 scripts/merge_new_stocks.py [--dry-run]
"""
import argparse
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "data")

ANCHOR = "2021-06-01"
END = "2026-06-01"
FIN_YEARS = list(range(2015, 2022))

# --- the selection -----------------------------------------------------------
# 25 that were small caps at the June-2021 anchor, and 25 large/mid, per
# data/_new_pool.json. Names are the display names; sectors drive peer groups.
SMALL = {
    "SANDESH": ("The Sandesh", "Media"),
    "ZENTEC": ("Zen Technologies", "Engineering & Capital Goods"),
    "GRAVITA": ("Gravita India", "Metals & Recycling"),
    "LUMAXIND": ("Lumax Industries", "Auto Components"),
    "APCOTEXIND": ("Apcotex Industries", "Specialty Chemicals"),
    "GABRIEL": ("Gabriel India", "Auto Components"),
    "HERITGFOOD": ("Heritage Foods", "FMCG"),
    "ARVIND": ("Arvind", "Textiles"),
    "REPCOHOME": ("Repco Home Finance", "NBFC/Financial Services"),
    "HIMATSEIDE": ("Himatsingka Seide", "Textiles"),
    "RAYMOND": ("Raymond", "Textiles"),
    "GREENPANEL": ("Greenpanel Industries", "Industrials/Building Materials"),
    "MINDACORP": ("Minda Corporation", "Auto Components"),
    "NILKAMAL": ("Nilkamal", "Industrials/Building Materials"),
    "DCBBANK": ("DCB Bank", "Banks"),
    "JAMNAAUTO": ("Jamna Auto Industries", "Auto Components"),
    "KIRLOSENG": ("Kirloskar Oil Engines", "Engineering & Capital Goods"),
    "NOCIL": ("NOCIL", "Specialty Chemicals"),
    "BAJAJCON": ("Bajaj Consumer Care", "FMCG"),
    "SUPRAJIT": ("Suprajit Engineering", "Auto Components"),
    "IFBIND": ("IFB Industries", "Consumer Durables"),
    "KARURVYSYA": ("Karur Vysya Bank", "Banks"),
    "NEWGEN": ("Newgen Software Technologies", "IT Services"),
    "CCL": ("CCL Products (India)", "Beverages"),
    "DEEPAKFERT": ("Deepak Fertilisers & Petrochemicals", "Fertilizers & Agrochem"),
}
BIG = {
    "TATAELXSI": ("Tata Elxsi", "IT Services"),
    "PERSISTENT": ("Persistent Systems", "IT Services"),
    "LTTS": ("L&T Technology Services", "IT Services"),
    "KPITTECH": ("KPIT Technologies", "IT Services"),
    "TANLA": ("Tanla Platforms", "IT Services"),
    "LAURUSLABS": ("Laurus Labs", "Pharma/Biotech"),
    "ALKEM": ("Alkem Laboratories", "Pharma/Biotech"),
    "TORNTPHARM": ("Torrent Pharmaceuticals", "Pharma/Biotech"),
    "AJANTPHARM": ("Ajanta Pharma", "Pharma/Biotech"),
    "DIXON": ("Dixon Technologies (India)", "Electronics Manufacturing"),
    "AMBER": ("Amber Enterprises India", "Electronics Manufacturing"),
    "POLYCAB": ("Polycab India", "Cables & Wires"),
    "KEI": ("KEI Industries", "Cables & Wires"),
    "CHOLAFIN": ("Cholamandalam Investment & Finance", "NBFC/Financial Services"),
    "MUTHOOTFIN": ("Muthoot Finance", "NBFC/Financial Services"),
    "MANAPPURAM": ("Manappuram Finance", "NBFC/Financial Services"),
    "FEDERALBNK": ("Federal Bank", "Banks"),
    "SRF": ("SRF", "Specialty Chemicals"),
    "NAVINFLUOR": ("Navin Fluorine International", "Specialty Chemicals"),
    "BALKRISIND": ("Balkrishna Industries", "Auto Components"),
    "BOSCHLTD": ("Bosch", "Auto Components"),
    "PAGEIND": ("Page Industries", "Textiles"),
    "THERMAX": ("Thermax", "Engineering & Capital Goods"),
    "JUBLFOOD": ("Jubilant FoodWorks", "Hospitality & QSR"),
    "INDHOTEL": ("The Indian Hotels Company", "Hospitality & QSR"),
}
SELECTED = {**SMALL, **BIG}

# Lending businesses: borrowings are raw material, so a debt/equity ratio is
# not meaningful. Mirrors the BANKS handling in build_snapshot.py.
LENDERS = {
    "DCBBANK", "KARURVYSYA", "FEDERALBNK",
    "REPCOHOME", "CHOLAFIN", "MUTHOOTFIN", "MANAPPURAM",
}


def cagr(a, b, n):
    if a is None or b is None or a <= 0 or b <= 0:
        return None
    return round(((b / a) ** (1 / n) - 1) * 100, 1)


def eps_note(fins):
    def fy(y, k):
        r = fins.get(f"FY{y}")
        return r.get(k) if r else None

    np18, np21 = fy(2018, "netProfit"), fy(2021, "netProfit")
    e18, e21 = fy(2018, "eps"), fy(2021, "eps")
    if e18 is None or e21 is None:
        return "EPS history unavailable for FY2018-FY2021 (recent listing or fiscal change)."
    if np18 is None or np18 <= 0 or (np21 is not None and np21 < 0):
        return "FY2018 or FY2021 loss-making - EPS-vs-profit growth comparison not meaningful."
    npc, epc = cagr(np18, np21, 3), cagr(e18, e21, 3)
    if npc is None or epc is None:
        return "Not enough data to assess EPS consistency."
    gap = npc - epc
    if abs(gap) < 2:
        return "EPS grew broadly in line with net profit - no material equity dilution."
    if gap > 0:
        return f"EPS CAGR {epc:.0f}% lags net-profit CAGR {npc:.0f}% - possible equity dilution."
    return f"EPS CAGR {epc:.0f}% exceeds net-profit CAGR {npc:.0f}% - share count reduced (buyback)."


def blurb(name, about, sector, cat):
    """Neutral profile built from the company's own description on screener."""
    first = ""
    if about:
        # Keep at most the first two sentences of the source description.
        parts = [p.strip() for p in about.replace("\n", " ").split(". ") if p.strip()]
        first = ". ".join(parts[:2]).rstrip(".")
    if first:
        return (
            f"{first}. It operates in the {sector} sector and was a "
            f"{cat.lower()}-cap company on the NSE as of June 2021."
        )
    return (
        f"{name} is an NSE-listed company in the {sector} sector. "
        f"It was a {cat.lower()}-cap company as of June 2021."
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    pool = json.loads(open(os.path.join(D, "_new_pool.json")).read())
    prices = json.loads(open(os.path.join(D, "prices.json")).read())
    ohlc = json.loads(open(os.path.join(D, "ohlc.json")).read())
    fins = json.loads(open(os.path.join(D, "financials.json")).read())
    snap = json.loads(open(os.path.join(D, "snapshot-2021.json")).read())

    before = {
        "prices": {k: v for k, v in prices.items()},
        "ohlc": {k: v for k, v in ohlc.items()},
        "financials": {k: v for k, v in fins.items()},
        "snapshot": {k: v for k, v in snap.items()},
    }

    problems = []
    added = []
    for t, (name, sector) in SELECTED.items():
        r = pool.get(t)
        if not r or r.get("status") != "OK":
            problems.append(f"{t}: missing or unusable in pool")
            continue

        pmap = {p["date"]: p["close"] for p in r["prices"]}
        if ANCHOR not in pmap or END not in pmap:
            problems.append(f"{t}: missing anchor or end month")
            continue

        eq = r.get("equity_capital_2021")
        res = r.get("reserves_2021")
        equity = (eq or 0) + (res or 0)
        neg = equity < 0
        np21 = r.get("np_2021")
        eps21 = r.get("eps_2021")
        raw21 = r.get("raw21")
        borrow = r.get("borrowings_2021")

        roe = round(np21 / equity * 100, 1) if (np21 is not None and equity > 0) else None
        de = None if t in LENDERS else (
            round(borrow / equity, 2) if (borrow is not None and equity > 0) else None
        )
        dy = round(r["ttm_div"] / raw21 * 100, 2) if (r.get("ttm_div") and raw21) else None
        pe = round(raw21 / eps21, 1) if (eps21 and eps21 > 0 and raw21) else None
        f = r.get("financials") or {}

        snap[t] = {
            "name": name,
            "sector": sector,
            "companyBlurb": blurb(name, r.get("about"), sector, r["cat"]),
            "price": pmap[ANCHOR],
            "ipoMonth": None,
            "effectiveEntry": pmap[ANCHOR],
            "negNetWorth": neg,
            "marketCap": r["mcap_cr"],
            "marketCapCategory": r["cat"],
            "pe": pe,
            "dividendYield": dy,
            "roe": None if neg else roe,
            "debtToEquity": None if neg else de,
            "promoterHolding": r.get("promoter_2021"),
            "promoterHoldingAsOf": None if r.get("promoter_2021") is None else "2021",
            "gpm": None,
            "opm": r.get("opm_2021"),
            "eps": eps21,
            "revenueGrowth3yr": cagr(f.get("FY2018", {}).get("revenue"),
                                     f.get("FY2021", {}).get("revenue"), 3),
            "revenueGrowth5yr": cagr(f.get("FY2016", {}).get("revenue"),
                                     f.get("FY2021", {}).get("revenue"), 5),
            "profitGrowth3yr": cagr(f.get("FY2018", {}).get("netProfit"),
                                    f.get("FY2021", {}).get("netProfit"), 3),
            "profitGrowth5yr": cagr(f.get("FY2016", {}).get("netProfit"),
                                    f.get("FY2021", {}).get("netProfit"), 5),
            "epsConsistencyNote": eps_note(f),
            "cfoNegativeYears": [
                f"FY{y}" for y in FIN_YEARS
                if (f.get(f"FY{y}", {}).get("cfo") is not None
                    and f[f"FY{y}"]["cfo"] < 0)
            ],
        }
        prices[t] = r["prices"]
        ohlc[t] = r["ohlc"]
        fins[t] = {f"FY{y}": f.get(f"FY{y}") for y in FIN_YEARS}
        added.append(t)

    # --- invariants ---------------------------------------------------------
    for key, original, now in (
        ("prices", before["prices"], prices),
        ("ohlc", before["ohlc"], ohlc),
        ("financials", before["financials"], fins),
        ("snapshot", before["snapshot"], snap),
    ):
        for k, v in original.items():
            if now.get(k) != v:
                problems.append(f"{key}: existing entry {k} was modified")

    for t in added:
        pm = {p["date"]: p["close"] for p in prices[t]}
        for bar in ohlc[t]:
            if pm.get(bar["date"]) != bar["c"]:
                problems.append(f"{t}: ohlc close != price close at {bar['date']}")
                break
            if not (bar["l"] <= bar["o"] <= bar["h"] and bar["l"] <= bar["c"] <= bar["h"]):
                problems.append(f"{t}: ohlc bounds violated at {bar['date']}")
                break

    cats = {}
    for t in added:
        cats[snap[t]["marketCapCategory"]] = cats.get(snap[t]["marketCapCategory"], 0) + 1

    print(f"selected {len(SELECTED)}, added {len(added)}")
    print("cap split:", cats)
    small = cats.get("Small", 0) + cats.get("Micro", 0)
    print(f"small (incl micro): {small} / {len(added)} = {small / max(1, len(added)) * 100:.0f}%")
    if problems:
        print("\nPROBLEMS:")
        for p in problems[:30]:
            print("  ", p)
        return 1

    if args.dry_run:
        print("\nDry run - nothing written.")
        return 0

    json.dump(prices, open(os.path.join(D, "prices.json"), "w"), separators=(",", ":"))
    json.dump(ohlc, open(os.path.join(D, "ohlc.json"), "w"), separators=(",", ":"))
    json.dump(fins, open(os.path.join(D, "financials.json"), "w"), separators=(",", ":"))
    json.dump(snap, open(os.path.join(D, "snapshot-2021.json"), "w"), indent=1)
    print(f"\nwrote data files; universe now {len(snap)} stocks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
