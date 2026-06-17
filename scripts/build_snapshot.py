"""Combine screener_raw.json + prices.json into the app's data files.

Window anchored to JUNE 2021 (5-year exercise: June 2021 -> June 2026).

Outputs:
  data/financials.json    id -> { "2015".."2021": {revenue,netProfit,eps,cfo} | null }
  data/snapshot-2021.json id -> { price, marketCap, marketCapCategory, pe,
                                  divYield, roe, de, promoterHolding, opm,
                                  ipoMonth, effectiveEntry, ... }
  data/missing-data-report.md

Consistency: screener historical EPS is bonus/split-adjusted to the current
share base, matching yfinance's split-adjusted June-2021 close, so
  PE      = adjClose(2021-06) / EPS(FY2021)
  MktCap  = PE * NetProfit(FY2021)
  DivYield= (payout% * EPS / 100) / adjClose(2021-06)
are internally consistent. ROE/D/E use FY2021 balance-sheet aggregates.
"""
import json, os
from stocks import STOCKS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

prices = json.load(open(os.path.join(DATA, "prices.json")))
raw = json.load(open(os.path.join(DATA, "screener_raw.json")))

ANCHOR = "2021-06"
FY = "2021"
YEARS = ["2015", "2016", "2017", "2018", "2019", "2020", "2021"]


def price_at(sid, month):
    for p in prices.get(sid, []):
        if p["date"] == month:
            return p["close"]
    return None


def first_price(sid):
    arr = prices.get(sid, [])
    return (arr[0]["date"], arr[0]["close"]) if arr else (None, None)


def cap_category(mktcap_cr):
    # SEBI/NSE-style bands (₹ Cr), as of June 2021.
    if mktcap_cr is None:
        return None
    if mktcap_cr >= 20000:
        return "Large"
    if mktcap_cr >= 5000:
        return "Mid"
    if mktcap_cr >= 500:
        return "Small"
    return "Micro"


financials = {}
snapshot = {}
gaps = []

for sid, yahoo, name, sector in STOCKS:
    r = raw.get(sid, {})
    sales = r.get("sales", {})
    np_ = r.get("net_profit", {})
    eps = r.get("eps", {})
    cfo = r.get("cfo", {})
    payout = r.get("dividend_payout", {})
    opm = r.get("opm", {})
    borrow = r.get("borrowings", {})
    eqcap = r.get("equity_capital", {})
    reserves = r.get("reserves", {})
    promoters = r.get("promoters", {})

    # ---- year-by-year financials table (FY2015-FY2021) ----
    fin = {}
    for y in YEARS:
        if y in np_ or y in sales or y in eps or y in cfo:
            fin[y] = {
                "revenue": sales.get(y),
                "netProfit": np_.get(y),
                "eps": eps.get(y),
                "cfo": cfo.get(y),
            }
        else:
            fin[y] = None
            gaps.append((sid, f"FY{y}", "no annual data for this year"))
    financials[sid] = fin

    # ---- June-2021 snapshot ----
    price = price_at(sid, ANCHOR)
    ipo_month, ipo_price = (None, None)
    effective_entry = price
    if price is None:
        fm, fp = first_price(sid)
        if fm and fm > ANCHOR:  # listed after the anchor (e.g. PAYTM)
            ipo_month, ipo_price = fm, fp
            effective_entry = fp
            gaps.append((sid, "listing", f"not listed at June 2021; IPO {fm}, using listing price as effective entry"))

    e21 = eps.get(FY)
    n21 = np_.get(FY)
    # P/E only meaningful with a real June-2021 price and positive EPS
    pe = round(price / e21, 1) if (price and e21 and e21 > 0) else None
    # Market cap = price * shares, where shares = NetProfit / EPS (same screener
    # basis as the adjusted price). Works for loss-makers too (both negative ->
    # positive share count), so large loss-making caps (e.g. Airtel FY2021) still
    # get a market cap and a size category. For profit-makers this equals PE*NP.
    shares = abs(n21 / e21) if (n21 and e21) else None  # ₹Cr NP / ₹ EPS = Cr shares
    mktcap = round(price * shares) if (price is not None and shares) else None
    dps21 = (payout.get(FY) / 100.0 * e21) if (payout.get(FY) is not None and e21) else None
    div_yield = round(dps21 / price * 100, 2) if (dps21 is not None and price and dps21 >= 0) else None

    equity21 = None
    if eqcap.get(FY) is not None and reserves.get(FY) is not None:
        equity21 = eqcap[FY] + reserves[FY]
    # Guard negative / zero net worth (e.g. Vodafone Idea) -> ratios meaningless
    neg_networth = equity21 is not None and equity21 <= 0
    roe = round(n21 / equity21 * 100, 1) if (n21 and equity21 and equity21 > 0) else None
    de = round(borrow.get(FY) / equity21, 2) if (borrow.get(FY) is not None and equity21 and equity21 > 0) else None
    if neg_networth:
        gaps.append((sid, "roe/de", "negative net worth (FY2021) — ROE/D/E not meaningful"))

    # promoter holding: screener free data reaches ~FY2023 -> earliest as proxy
    prom_val, prom_asof = None, None
    if promoters:
        prom_asof = sorted(promoters.keys())[0]
        prom_val = promoters[prom_asof]
        if prom_asof != FY:
            gaps.append((sid, "promoterHolding", f"June-2021 unavailable; earliest screener value (FY{prom_asof})"))
    else:
        gaps.append((sid, "promoterHolding", "not available from screener"))

    if pe is None and not neg_networth and ipo_month is None:
        gaps.append((sid, "pe", "loss-making or missing FY2021 EPS — no meaningful P/E"))
    gaps.append((sid, "grossMargin", "not exposed by screener; OPM% shown instead"))

    snapshot[sid] = {
        "name": name,
        "sector": sector,
        "price": price,
        "ipoMonth": ipo_month,
        "effectiveEntry": effective_entry,
        "negNetWorth": neg_networth,
        "marketCap": mktcap,
        "marketCapCategory": cap_category(mktcap),
        "pe": pe,
        "divYield": div_yield,
        "roe": roe,
        "de": de,
        "promoterHolding": prom_val,
        "promoterHoldingAsOf": prom_asof,
        "opm": opm.get(FY),
        "grossMargin": None,
    }

json.dump(financials, open(os.path.join(DATA, "financials.json"), "w"), indent=0)
json.dump(snapshot, open(os.path.join(DATA, "snapshot-2021.json"), "w"), indent=1)

# ---- missing-data report ----
have_pe = sum(1 for s in snapshot.values() if s["pe"] is not None)
have_roe = sum(1 for s in snapshot.values() if s["roe"] is not None)
have_de = sum(1 for s in snapshot.values() if s["de"] is not None)
lines = [
    "# Missing Data Report",
    "",
    "Fixed window: prices Jan 2000-June 2026 (monthly). Anchor = **June 2021**; "
    "financials FY2015-FY2021. All values reproducible against the fixed "
    "June-2026 reference date.",
    "",
    "## Coverage summary",
    "",
    "- **Universe:** 40 NSE stocks (34 fundamentally strong + 6 deliberate weak/\"trap\" "
    "picks: IDEA, ZEEL, YESBANK, TATASTEEL, COALINDIA, IOC). The UI never labels which is "
    "which — students must read the FA data.",
    "- **Prices (monthly, Jan 2000-June 2026):** 40/40 stocks + Nifty 50 real (yfinance). "
    "Every stock has the June-2021 and June-2026 anchor months. Some series start at their "
    "real listing date (POLYCAB 2019, GRINDWELL 2006, PAGEIND 2007).",
    "- **Annual financials FY2015-FY2021:** real (screener.in P&L + cash flow), full 7-year "
    "table. ABB India reports on a **December** fiscal year, so its \"FY2021\" column = "
    "calendar 2021. FINOLEXIND uses screener slug FINPIPE (Finolex Industries).",
    f"- **June-2021 snapshot ratios:** P/E for {have_pe}/40, ROE for {have_roe}/40, "
    f"D/E for {have_de}/40. Derived from real FY2021 financials + the real "
    "split/bonus-adjusted June-2021 close. Banks (HDFCBANK, ICICIBANK, KOTAKBANK, YESBANK) "
    "have no meaningful D/E.",
    "- **Vodafone Idea (IDEA):** negative net worth in FY2021 (accumulated losses exceed "
    "equity) and a net loss, so P/E is blank and D/E shows \"N/A (negative equity)\" — itself "
    "a red flag students should catch.",
    "- **Promoter holding:** screener's free shareholding table only reaches ~FY2023, so "
    "the earliest available figure is shown as a labelled proxy (ZEEL's low promoter holding "
    "is genuine).",
    "- **Gross Profit Margin:** not exposed by screener; OPM% (operating margin) shown instead.",
    "",
    "## Per-field gaps",
    "",
]
by_field = {}
for sid, field, note in gaps:
    by_field.setdefault(field, []).append((sid, note))
for field in sorted(by_field):
    items = by_field[field]
    sids = ", ".join(sid for sid, _ in items)
    lines.append(f"- **{field}** ({len(items)}): {items[0][1]}  \n  _{sids}_")
open(os.path.join(DATA, "missing-data-report.md"), "w").write("\n".join(lines) + "\n")

print("financials.json, snapshot-2021.json, missing-data-report.md written")
print(f"PE: {have_pe}/40  ROE: {have_roe}/40  D/E: {have_de}/40")
print("\nNew / notable snapshots:")
for sid in ["IDEA", "ZEEL", "YESBANK", "BHARTIARTL", "TATASTEEL", "TCS", "HDFCBANK"]:
    s = snapshot.get(sid)
    if not s:
        continue
    print(f"  {sid:11} price={s['price']} cat={s['marketCapCategory']} mktcap={s['marketCap']} "
          f"PE={s['pe']} ROE={s['roe']} D/E={s['de']} negNW={s['negNetWorth']} OPM={s['opm']}")
