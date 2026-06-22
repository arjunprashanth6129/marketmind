#!/usr/bin/env python3
"""Add selection_rationale to ideal-portfolios.json and write the two reports."""
import json
from collections import defaultdict

ports=json.load(open("data/ideal-portfolios.json"))
E=json.load(open("data/_elig.json")); elig=E["elig"]; pool=set(E["pool"])
NIFTY=53.7

# cross-scenario repeats
usage=defaultdict(list)
for p in ports:
    for st in p["stocks"]: usage[st["ticker"]].append(p["scenario"])
repeats={t:v for t,v in usage.items() if len(v)>1}

RAT={
"fresh-graduate":"Highest-risk, longest-horizon: tilts to the two eligible mid-caps (GRINDWELL, ZENSARTECH) plus the two highest-returning eligible large-caps (COFORGE +89%, BPCL +90%), with NESTLEIND as a defensive large-cap hedge. SUBSTITUTION: the brief asks for 1 large + 4 small/mid, but only 2 eligible mid-caps and 0 eligible small-caps exist, so two large-cap growth names fill the missing small/mid slots. GRINDWELL/ZENSARTECH/NESTLEIND also appear in other scenarios — reused because they stay the best eligible fits.",
"newly-married":"Moderate-high risk: blends the two eligible mid-caps (GRINDWELL, ZENSARTECH) with three growth-leaning eligible large-caps (COFORGE, SUPREMEIND, DIVISLAB). DEVIATION: target was 2 large + 3 mid, but only 2 eligible mid-caps exist, so the realised mix is 3 large + 2 mid. COFORGE and both mids repeat from Fresh Graduate; SUPREMEIND also appears in Pre-Retirement.",
"young-family":"Moderate risk, balance: three steady large-cap compounders (NESTLEIND, ITC, MARICO — low-volatility consumer staples) plus the two eligible mid-caps (GRINDWELL, ZENSARTECH). Hits the 3 large + 2 mid target exactly. NESTLEIND/ITC/MARICO repeat in the retirement scenarios and the two mids repeat in the growth scenarios — all remain the steadiest eligible picks for this profile.",
"pre-retirement":"All large-cap, preservation + growth, prioritising high ROE and low debt: NESTLEIND (ROE 103%), MARICO (37%), SUPREMEIND (31%, near-zero debt), ITC (22%, debt-free) and BPCL (32% ROE, 4.5% yield). All five repeat from other scenarios — reused because they are the strongest high-ROE / low-D-E eligible large-caps for a lower-moderate risk profile.",
"elderly-retired":"Lowest risk, income focus: the highest-dividend eligible large-caps — ITC (10.7% TTM yield), BPCL (4.5%), TECHM (3.2%) — plus low-volatility MARICO and NESTLEIND for capital protection. Every name repeats from other scenarios — reused because they offer the best mix of dividend income and stability among eligible stocks.",
}
for p in ports: p["selection_rationale"]=RAT[p["scenarioId"]]
json.dump(ports,open("data/ideal-portfolios.json","w"),indent=1)

# ---- eligible-pool-report.md ----
order=sorted(elig,key=lambda t:-elig[t]["ret"])
m=["# Eligible Pool Report — 40 \"Good\" stocks screened for ideal portfolios","",
   "Two mandatory filters, applied to verified June-2021→June-2026 data:",
   "1. **Beats Nifty** — total return > **+53.7%**.",
   "2. **Sound FY2021 fundamentals** — positive & reasonably strong ROE (≥12%), positive CFO, "
   "positive net profit, no EPS-dilution/loss flag, reasonable debt (high D/E tolerated only for "
   "banks/NBFCs with strong ROE + positive CFO), no near-zero promoter / governance flag.","",
   "| Ticker | Verified Return % | Beats Nifty (+53.7%)? | Fundamentals Pass? | Status | Reason if excluded |",
   "|---|---|---|---|---|---|"]
for t in order:
    e=elig[t]
    beats="Yes" if e["beats"] else "No"
    fund="Yes" if e["fund_ok"] else "No"
    status="**ELIGIBLE**" if e["eligible"] else "EXCLUDED"
    if e["eligible"]:
        reason="—"
    else:
        rs=e["reasons"][:]
        reason="; ".join(rs)
    m.append(f"| {t} | {e['ret']} | {beats} | {fund} | {status} | {reason} |")
m+= ["",f"**Eligible pool: {len(pool)} stocks** — Large: "
     f"{', '.join(t for t in pool if elig[t]['cat']=='Large')}; "
     f"Mid: {', '.join(t for t in pool if elig[t]['cat']=='Mid')}; "
     f"Small: {', '.join(t for t in pool if elig[t]['cat']=='Small') or 'none'}.","",
     "**Notable exclusions despite beating Nifty:** VBL (+454.5%) — EPS-dilution flag + sub-12% ROE; "
     "TATAMOTORS (+132.3%) — FY21 net loss / negative ROE; AXISBANK (+82.5%) — weak FY21 ROE 7% + "
     "dilution flag; RPOWER (+77.7%) — weak ROE 3.7%, declining EPS/NP, high debt; BAJFINANCE (+62.7%) — "
     "negative FY21 operating cash flow (−₹807 Cr).","",
     "**Judgement call (flagged):** ITC shows 0% promoter holding, but this reflects its status as a "
     "professionally-managed, widely-held company with no identifiable promoter group (not a governance "
     "red flag); it is otherwise strong (ROE 22%, debt-free, large positive CFO) and is kept ELIGIBLE. "
     "Tell me if you'd rather exclude it.",""]
open("data/eligible-pool-report.md","w").write("\n".join(m))

# ---- ideal-portfolios-verification.md ----
v=["# Ideal Portfolios — Verification","",
   "Every portfolio is built only from the 11-stock eligible pool; every constituent individually "
   "beats Nifty, so each portfolio's blended return does too (confirmed below).","",
   "| Scenario | Stocks | Total Return % | vs Nifty (+53.7%) | Pass/Fail | Repeated stocks (also used in) |",
   "|---|---|---|---|---|---|"]
for p in ports:
    tl=", ".join(st["ticker"] for st in p["stocks"])
    reps=[]
    for st in p["stocks"]:
        others=[o for o in repeats.get(st["ticker"],[]) if o!=p["scenario"]]
        if others: reps.append(f"{st['ticker']} (→ {', '.join(others)})")
    rep="; ".join(reps) if reps else "none"
    pf="**PASS**" if p["portfolio_total_return_pct"]>NIFTY else "FAIL"
    v.append(f"| {p['scenario']} | {tl} | +{p['portfolio_total_return_pct']} | +{p['vs_nifty_pct_points']} pp | {pf} | {rep} |")
v+=["","**Cap-mix deviations (eligible pool has 9 Large, 2 Mid, 0 Small):**",
    "- *Fresh Graduate* (target 1 large + 4 small/mid): only 2 eligible mid-caps and no eligible "
    "small-caps, so 2 large-cap growth names (COFORGE, BPCL) substitute for the missing small/mid slots → realised 3 large + 2 mid.",
    "- *Newly Married* (target 2 large + 3 mid): only 2 eligible mid-caps, so realised 3 large + 2 mid.",
    "- *Young Family / Pre-Retirement / Elderly Retired*: targets met (3+2, all-large, all-large respectively).",""]
open("data/ideal-portfolios-verification.md","w").write("\n".join(v))
print("WROTE eligible-pool-report.md, ideal-portfolios-verification.md, and rationales into ideal-portfolios.json")
for p in ports:
    print(f"  {p['scenario']:26} +{p['portfolio_total_return_pct']}% (vs Nifty +{p['vs_nifty_pct_points']}pp)  series[0]={p['monthly_indexed_series'][0]['value']} series[-1]={p['monthly_indexed_series'][-1]['value']}")
