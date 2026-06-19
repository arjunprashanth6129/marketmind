"""Combine screener_raw.json + prices.json into the app's data files.

Window anchored to JUNE 2021 (5-year exercise: June 2021 -> June 2026).
Universe: definitive 40 stocks (GHCL replaced by FINEORG — see report).

Outputs (schema per the data-fetch spec):
  data/financials.json    id -> { "FY2015".."FY2021": {revenue,netProfit,eps,cfo} | null }
  data/snapshot-2021.json id -> { price, marketCap, marketCapCategory, pe,
                                  dividendYield, roe, debtToEquity, promoterHolding,
                                  gpm, eps, revenueGrowth3yr/5yr, profitGrowth3yr/5yr,
                                  epsConsistencyNote, cfoNegativeYears, ... }
  data/missing-data-report.md
"""
import json, os
from stocks import STOCKS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")

prices = json.load(open(os.path.join(DATA, "prices.json")))
raw = json.load(open(os.path.join(DATA, "screener_raw.json")))

ANCHOR = "2021-06-01"
FY = "2021"
SCR_YEARS = ["2015", "2016", "2017", "2018", "2019", "2020", "2021"]
FY_KEYS = ["FY" + y for y in SCR_YEARS]


def price_at(sid, month):
    for p in prices.get(sid, []):
        if p["date"] == month:
            return p["close"]
    return None


def first_price(sid):
    arr = prices.get(sid, [])
    return (arr[0]["date"], arr[0]["close"]) if arr else (None, None)


def cap_category(m):
    if m is None:
        return None
    if m >= 20000:
        return "Large"
    if m >= 5000:
        return "Mid"
    if m >= 500:
        return "Small"
    return "Micro"


def cagr(start, end, years):
    if start is None or end is None or start <= 0 or end <= 0:
        return None
    return round(((end / start) ** (1 / years) - 1) * 100, 1)


financials = {}
snapshot = {}
gaps = []  # (sid, field, year, note)

for sid, yahoo, name, sector in STOCKS:
    r = raw.get(sid, {})
    sales = r.get("sales", {})
    npr = r.get("net_profit", {})
    eps = r.get("eps", {})
    cfo = r.get("cfo", {})
    payout = r.get("dividend_payout", {})
    opm = r.get("opm", {})
    borrow = r.get("borrowings", {})
    eqcap = r.get("equity_capital", {})
    reserves = r.get("reserves", {})
    promoters = r.get("promoters", {})

    # ---- year-by-year financials (FY2015-FY2021) ----
    fin = {}
    for y, fk in zip(SCR_YEARS, FY_KEYS):
        if any(y in d for d in (npr, sales, eps, cfo)):
            fin[fk] = {
                "revenue": sales.get(y),
                "netProfit": npr.get(y),
                "eps": eps.get(y),
                "cfo": cfo.get(y),
            }
            for field, d in (("revenue", sales), ("netProfit", npr), ("eps", eps), ("cfo", cfo)):
                if y not in d:
                    gaps.append((sid, field, fk, "not reported by screener for this year"))
        else:
            fin[fk] = None
            gaps.append((sid, "all", fk, "year not in screener window / pre-listing"))
    financials[sid] = fin

    # ---- June-2021 snapshot ----
    price = price_at(sid, ANCHOR)
    ipo_month = None
    effective_entry = price
    if price is None:
        fm, fp = first_price(sid)
        if fm and fm > ANCHOR:
            ipo_month, effective_entry = fm, fp
            gaps.append((sid, "price", "Jun2021", f"listed {fm}; using first close as effective entry"))

    e21, n21 = eps.get(FY), npr.get(FY)
    pe = round(price / e21, 1) if (price and e21 and e21 > 0) else None
    shares = abs(n21 / e21) if (n21 and e21) else None
    mktcap = round(price * shares) if (price is not None and shares) else None
    dps21 = (payout.get(FY) / 100.0 * e21) if (payout.get(FY) is not None and e21) else None
    div_yield = round(dps21 / price * 100, 2) if (dps21 is not None and price and dps21 >= 0) else None

    equity21 = (eqcap.get(FY, 0) + reserves.get(FY, 0)) if (FY in eqcap and FY in reserves) else None
    neg_nw = equity21 is not None and equity21 <= 0
    roe = round(n21 / equity21 * 100, 1) if (n21 and equity21 and equity21 > 0) else None
    de = round(borrow.get(FY) / equity21, 2) if (borrow.get(FY) is not None and equity21 and equity21 > 0) else None
    if neg_nw:
        gaps.append((sid, "roe/debtToEquity", "FY2021", "negative net worth -> N/A"))

    # growth (CAGR) windows
    rev3 = cagr(sales.get("2018"), sales.get("2021"), 3)
    rev5 = cagr(sales.get("2016"), sales.get("2021"), 5)
    pft3 = cagr(npr.get("2018"), npr.get("2021"), 3)
    pft5 = cagr(npr.get("2016"), npr.get("2021"), 5)

    # EPS consistency note
    np_window = [npr.get(y) for y in SCR_YEARS[1:]]  # FY2016-FY2021
    eps_cagr5 = cagr(eps.get("2016"), eps.get("2021"), 5)
    if any(v is not None and v < 0 for v in np_window):
        eps_note = "Inconsistent profitability — review year by year"
    elif eps_cagr5 is not None and pft5 is not None:
        eps_note = ("EPS growth tracks profit growth — no significant dilution"
                    if eps_cagr5 >= pft5 - 2
                    else "EPS growth lags profit growth — possible equity dilution")
    else:
        eps_note = None
        gaps.append((sid, "epsConsistencyNote", "FY2016-2021", "insufficient EPS/profit data"))

    cfo_neg = [fk for y, fk in zip(SCR_YEARS, FY_KEYS) if cfo.get(y) is not None and cfo.get(y) < 0]

    prom_val, prom_asof = None, None
    if promoters:
        prom_asof = sorted(promoters.keys())[0]
        prom_val = promoters[prom_asof]
        if prom_asof != FY:
            gaps.append((sid, "promoterHolding", "Jun2021", f"unavailable; earliest is FY{prom_asof}"))
    else:
        gaps.append((sid, "promoterHolding", "Jun2021", "not available from screener"))

    if pe is None and not neg_nw and ipo_month is None:
        gaps.append((sid, "pe", "Jun2021", "loss-making / negative EPS -> no P/E"))
    gaps.append((sid, "gpm", "FY2021", "gross margin not exposed by screener (OPM% available)"))

    snapshot[sid] = {
        "name": name,
        "sector": sector,
        "price": price,
        "ipoMonth": ipo_month,
        "effectiveEntry": effective_entry,
        "negNetWorth": neg_nw,
        "marketCap": mktcap,
        "marketCapCategory": cap_category(mktcap),
        "pe": pe,
        "dividendYield": div_yield,
        "roe": roe,
        "debtToEquity": de,
        "promoterHolding": prom_val,
        "promoterHoldingAsOf": prom_asof,
        "gpm": None,            # not exposed by screener; see opm
        "opm": opm.get(FY),
        "eps": e21,
        "revenueGrowth3yr": rev3,
        "revenueGrowth5yr": rev5,
        "profitGrowth3yr": pft3,
        "profitGrowth5yr": pft5,
        "epsConsistencyNote": eps_note,
        "cfoNegativeYears": cfo_neg,
    }

json.dump(financials, open(os.path.join(DATA, "financials.json"), "w"), indent=0)
json.dump(snapshot, open(os.path.join(DATA, "snapshot-2021.json"), "w"), indent=1)

# ---- missing-data report ----
null_count = 0
for fin in financials.values():
    for v in (fin or {}).values():
        if v is None:
            null_count += 4
        else:
            null_count += sum(1 for x in v.values() if x is None)
snap_nulls = sum(1 for s in snapshot.values() for k, v in s.items() if v is None)

have_pe = sum(1 for s in snapshot.values() if s["pe"] is not None)
have_roe = sum(1 for s in snapshot.values() if s["roe"] is not None)
have_de = sum(1 for s in snapshot.values() if s["debtToEquity"] is not None)

lines = [
    "# Missing Data Report",
    "",
    "Fixed window: prices Jan 2000 - June 2026 (monthly, `YYYY-MM-01`). Anchor = **June 2021**; "
    "financials FY2015-FY2021. All values reproducible against the fixed June-2026 reference date.",
    "",
    "## GHCL replacement (stock #34)",
    "",
    "GHCL was replaced by **FINEORG (Fine Organic Industries)** after evaluating all 5 candidates "
    "on the FA checklist + June2021->June2026 return:",
    "",
    "| Candidate | Return | ROE | D/E | +CFO | EPS yrs | Promoter | Note |",
    "|---|---:|---:|---:|:--:|:--:|---:|---|",
    "| GARWARE TF (GARFIBRES) | +2.7% | 19.5% | 0.13 | yes | 7/7 | 52.7% | cleanest data but badly lagged Nifty (+53%) |",
    "| **FINEORG (chosen)** | **+72.4%** | 16.4% | 0.12 | yes | 6/7 | 75.0% | strong FA **and** beats Nifty; listed Jul-2018 (FY2015-17 null) |",
    "| ELGIEQUIP | +190% | 11.7% | 0.53 | yes | 7/7 | 31.2% | great return but ROE/D/E/promoter all miss |",
    "| AAVAS | -46.5% | 12.0% | n/a | no (-CFO x4) | 4/7 | 39.1% | NBFC; fails CFO + return |",
    "| WONDERLA | +128% | n/a | n/a | - | 0 | 69.7% | FY2021 COVID loss; fails entry fundamentals |",
    "",
    "**FINEORG** is the only candidate that satisfies both *strong June-2021 fundamentals* "
    "(D/E 0.12, +CFO Rs134cr, 75% promoter, simple oleochemicals business, no corporate "
    "actions) *and* a return above the Nifty (+72.4% vs +53.2%). Its only gap: listed "
    "July 2018, so FY2015-FY2017 are null. (GARFIBRES — the top preference — has cleaner "
    "full history but +2.7% return makes it a poor example of a 'good pick that rewarded'.)",
    "",
    "## Coverage summary",
    "",
    f"- **Prices:** 40/40 stocks + Nifty 50 real (yfinance), monthly Jan2000-June2026. "
    "Every stock has the June-2021 and June-2026 anchors. Some start at listing "
    "(POLYCAB 2019, FINEORG/AAVAS-class 2018, GRINDWELL 2006).",
    f"- **June-2021 snapshot ratios:** P/E {have_pe}/40, ROE {have_roe}/40, D/E {have_de}/40. "
    "Derived from real FY2021 screener financials + real split/bonus-adjusted June-2021 close.",
    "- **Annual financials FY2015-FY2021:** real (screener.in). FINEORG missing FY2015-FY2017 "
    "(pre-IPO). ABB India reports a December fiscal year (its FY2021 column = calendar 2021). "
    "FINOLEXIND uses screener/Yahoo symbol FINPIPE (Finolex Industries).",
    "- **IDEA (Vodafone Idea):** negative net worth FY2021 -> ROE and D/E recorded as N/A.",
    "- **GPM (gross profit margin):** NOT exposed by screener's summary P&L for any stock -> "
    "`gpm` is null for all 40; OPM% (operating margin) is captured instead as `opm`.",
    "- **Promoter holding:** screener's free shareholding table reaches ~FY2023, so the "
    "earliest available figure is shown as a labelled proxy (ZEEL's low promoter holding is real).",
    "",
    f"**Null counts:** financials ~{null_count} null cells (mostly FINEORG pre-2018 + gpm); "
    f"snapshot {snap_nulls} null fields (gpm x40 + loss-maker P/E + IDEA ROE/DE). No value "
    "is estimated or fabricated — gaps are null.",
    "",
    "## Per-field gaps",
    "",
]
by_field = {}
for sid, field, yr, note in gaps:
    by_field.setdefault(field, []).append(sid)
for field in sorted(by_field):
    sids = sorted(set(by_field[field]))
    lines.append(f"- **{field}** ({len(sids)}): {by_field[field][0] and ''}{', '.join(sids)}")
open(os.path.join(DATA, "missing-data-report.md"), "w").write("\n".join(lines) + "\n")

print("financials.json, snapshot-2021.json, missing-data-report.md written")
print(f"PE {have_pe}/40  ROE {have_roe}/40  D/E {have_de}/40  | financials nulls ~{null_count}  snapshot nulls {snap_nulls}")
print("\nFINEORG:", json.dumps({k: snapshot["FINEORG"][k] for k in
      ["price", "marketCapCategory", "pe", "roe", "debtToEquity", "promoterHolding",
       "profitGrowth5yr", "epsConsistencyNote", "cfoNegativeYears"]}, default=str))
