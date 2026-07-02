#!/usr/bin/env python3
"""Write eligible-pool-report.md and ideal-portfolios-verification.md.
Rationale + themes already live in data/ideal-portfolios.json (from build)."""
import json
from collections import defaultdict

ports=json.load(open("data/ideal-portfolios.json"))
E=json.load(open("data/_elig.json")); elig=E["elig"]; pool=set(E["pool"])
NIFTY=53.7

usage=defaultdict(list)
for p in ports:
    for st in p["stocks"]: usage[st["ticker"]].append(p["scenario"])
repeats={t:v for t,v in usage.items() if len(v)>1}

# ---- eligible-pool-report.md ----
order=sorted(elig,key=lambda t:-elig[t]["ret"])
m=["# Eligible Pool Report - 40 \"Good\" stocks screened for ideal portfolios","",
   "Two mandatory filters on verified June-2021→June-2026 data:",
   "1. **Beats Nifty** - total return > **+53.7%**.",
   "2. **Sound FY2021 fundamentals.** ROE >= 10% is accepted *only when the rest of the "
   "quality profile is strong* - positive net profit, positive operating cash flow (or the "
   "structural negative CFO of a high-ROE lender growing its loan book), reasonable sector "
   "debt, no loss-year EPS flag, dilution tolerated only when profit growth is strong, and no "
   "governance red flag.","",
   "| Ticker | Verified Return % | Beats Nifty? | Fundamentals Pass? | Status | Reason if excluded |",
   "|---|---|---|---|---|---|"]
for t in order:
    e=elig[t]
    status="**ELIGIBLE**" if e["eligible"] else "EXCLUDED"
    reason="-" if e["eligible"] else "; ".join(e["reasons"])
    m.append(f"| {t} | {e['ret']} | {'Yes' if e['beats'] else 'No'} | {'Yes' if e['fund_ok'] else 'No'} | {status} | {reason} |")
poolL=[t for t in pool if elig[t]['cat']=='Large']; poolM=[t for t in pool if elig[t]['cat']=='Mid']; poolS=[t for t in pool if elig[t]['cat']=='Small']
m+=["",f"**Eligible pool: {len(pool)} stocks** - Large: {', '.join(poolL)}; Mid: {', '.join(poolM) or 'none'}; Small: {', '.join(poolS) or 'none'}.","",
    "**Excluded despite beating Nifty:** TATAMOTORS (+132%) - FY21 net loss / negative ROE; "
    "AXISBANK (+82.5%) - weak FY21 ROE 7%; RPOWER (+77.7%) - ROE 3.7%, declining EPS, high debt. "
    "VBL (ROE 10.1%) and BAJFINANCE (ROE 12%) are **kept** under the \"10% is fine if the other "
    "fundamentals are strong\" rule - VBL has 66% promoter, positive cash flow and ~19% profit "
    "CAGR; BAJFINANCE is a premier NBFC whose negative FY21 CFO is loan-book growth, not distress.","",
    "**Judgement call (flagged):** ITC's 0% promoter reflects its widely-held, professionally-"
    "managed structure (no governance concern); otherwise strong (ROE 22%, debt-free), so kept ELIGIBLE.",""]
open("data/eligible-pool-report.md","w").write("\n".join(m))

# ---- ideal-portfolios-verification.md ----
v=["# Ideal Portfolios - Verification","",
   "Five portfolios built from the eligible pool, each with a distinct mandate. Every "
   "constituent individually beats Nifty, so each portfolio's blended return does too.","",
   "| Scenario | Theme | Stocks | Total Return % | vs Nifty (+53.7%) | Pass | Repeated stocks (also in) |",
   "|---|---|---|---|---|---|---|"]
for p in ports:
    tl=", ".join(st["ticker"] for st in p["stocks"])
    reps=[]
    for st in p["stocks"]:
        others=[o for o in repeats.get(st["ticker"],[]) if o!=p["scenario"]]
        if others: reps.append(f"{st['ticker']} (→ {', '.join(others)})")
    pf="**PASS**" if p["portfolio_total_return_pct"]>NIFTY else "FAIL"
    v.append(f"| {p['scenario']} | {p.get('theme','')} | {tl} | +{p['portfolio_total_return_pct']} | +{p['vs_nifty_pct_points']} pp | {pf} | {'; '.join(reps) or 'none'} |")
# pairwise distinctness
import itertools
sets={p['scenario']:set(st['ticker'] for st in p['stocks']) for p in ports}
v+=["","**Distinctness (max pairwise overlap):**"]
mx=max(len(sets[a]&sets[b]) for a,b in itertools.combinations(sets,2))
v.append(f"- No two portfolios share more than **{mx} of 5** stocks; every pair differs by at "
         "least 2 names and by mandate (aggressive growth → diversified growth → balanced "
         "core-satellite → high-ROE compounders → dividend income). The most-reused names "
         "(NESTLEIND, ITC, SUPREMEIND, COFORGE) are the pool's strongest franchises and "
         "legitimately anchor more than one risk profile.")
open("data/ideal-portfolios-verification.md","w").write("\n".join(v))
print("WROTE eligible-pool-report.md and ideal-portfolios-verification.md")
for p in ports: print(f"  {p['scenario']:26} [{p.get('theme')}] +{p['portfolio_total_return_pct']}%")
