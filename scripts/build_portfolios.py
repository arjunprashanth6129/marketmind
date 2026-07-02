#!/usr/bin/env python3
"""Eligible pool (refined filter) + 5 DIFFERENTIATED ideal scenario portfolios."""
import json

p=json.load(open("data/prices.json")); s=json.load(open("data/snapshot-2021.json")); f=json.load(open("data/financials.json"))
NIFTY=53.7
A,E="2021-06-01","2026-06-01"
def at(series,d): return next((x["close"] for x in series if x["date"]==d),None)
def entry(t):
    v=at(p[t],A); return v if v is not None else s[t].get("effectiveEntry")
def ret(t): return round((at(p[t],E)/entry(t)-1)*100,1)

BAD={'RAJESHEXPO','JPASSOCIAT','RELAXO','AAVAS','AARTIIND','ZEEL','GUJGASLTD','IGL','PAYTM','WIPRO'}
GOOD=[t for t in s if t not in BAD]

# ---- ELIGIBILITY (refined) ----
# Filter 1: total return > +53.7% (beat Nifty).
# Filter 2: sound FY2021 fundamentals. ROE >= 10% is acceptable *provided the
# rest of the quality profile is strong* (the brief: "10% is fine as long as the
# other fundamentals are good"). Requirements:
#   - positive net profit (no loss year)
#   - ROE >= 10%
#   - positive CFO  OR  a bank/NBFC where negative CFO is the structural
#     signature of loan-book growth (still requires ROE >= 10)
#   - reasonable debt for the sector (lenders exempt from the D/E cap)
#   - EPS-dilution flag tolerated only when 3yr profit growth is strongly
#     positive (i.e. growth-funded equity, not distress)
#   - no governance red flag (ITC's 0% promoter = professionally managed, OK)
elig={}; pool={}
for t in GOOD:
    r=ret(t); sn=s[t]; fy=f[t].get("FY2021") or {}
    cfo=fy.get("cfo"); npf=fy.get("netProfit"); roe=sn["roe"]; de=sn["debtToEquity"]
    note=sn["epsConsistencyNote"] or ""; prom=sn["promoterHolding"]; cat=sn["marketCapCategory"]
    prof3=sn["profitGrowth3yr"]; sector=sn["sector"]
    is_lender = ("Bank" in sector) or ("NBFC" in sector)
    reasons=[]
    beats = r>NIFTY
    if not beats: reasons.append(f"return {r}% does not beat Nifty +53.7%")
    if npf is None or npf<=0: reasons.append(f"FY2021 net profit not positive ({npf})")
    if roe is None or roe<10: reasons.append(f"ROE {roe}% below 10% threshold")
    cfo_ok = (cfo is not None and cfo>0) or (is_lender and roe is not None and roe>=10)
    if not cfo_ok: reasons.append(f"FY2021 CFO not positive ({cfo}) and not a lender exception")
    if (not is_lender) and de is not None and de>1.5:
        reasons.append(f"elevated D/E {de} (non-lender)")
    if "lags net-profit" in note and not (prof3 is not None and prof3>0):
        reasons.append("EPS dilution without offsetting profit growth")
    if "loss-making" in note: reasons.append("loss-year EPS flag")
    if prom is not None and prom<5 and t!="ITC":
        reasons.append(f"near-zero promoter holding {prom}%")
    fund_ok = not any(x for x in reasons if "Nifty" not in x)
    eligible = beats and fund_ok
    elig[t]=dict(ret=r,cat=cat,roe=roe,de=de,cfo=cfo,dy=sn["dividendYield"],beats=beats,
                 fund_ok=fund_ok,eligible=eligible,reasons=reasons,note=note,prom=prom,sector=sector)
    if eligible: pool[t]=elig[t]

print("ELIGIBLE POOL (%d): %s"%(len(pool),sorted(pool,key=lambda t:-pool[t]['ret'])))
for t in sorted(GOOD,key=lambda x:-elig[x]["ret"]):
    if elig[t]["beats"] and not elig[t]["eligible"]:
        print("  EXCLUDED",t,elig[t]["ret"],[r for r in elig[t]["reasons"] if "Nifty" not in r])

# ---- 5 DIFFERENTIATED PORTFOLIOS ----
PORT={
 "fresh-graduate":("Fresh Graduate","Aggressive Growth",50000,
    ["VBL","COFORGE","BAJFINANCE","GRINDWELL","ZENSARTECH"],
    "Built for maximum long-horizon growth and the highest risk budget. Anchored by VBL - a +454% beverages multibagger with 66% promoter holding and strong operating cash flow - alongside COFORGE (high-growth IT) and BAJFINANCE (India's premier consumer-finance NBFC, ~21% profit CAGR), with two quality mid-caps (GRINDWELL, ZENSARTECH) for additional beta. Highest expected return and volatility in the set; appropriate only where a multi-decade horizon can absorb drawdowns."),
 "newly-married":("Newly Married Couple","Diversified Growth",200000,
    ["BPCL","COFORGE","SUPREMEIND","SUNDARMFIN","DIVISLAB"],
    "A five-sector growth book with no single-sector concentration - BPCL (energy), COFORGE (IT), SUPREMEIND (industrials/plastics), SUNDARMFIN (vehicle financing) and DIVISLAB (pharma APIs). Every holding cleared the quality screen (positive cash flow, sound balance sheet) and beats the index; diversification dampens single-name risk for a moderate-high profile."),
 "young-family":("Young Family with Toddlers","Balanced Core-Satellite",300000,
    ["NESTLEIND","ITC","SUPREMEIND","GRINDWELL","DIVISLAB"],
    "A core-satellite construction: two low-volatility consumer-staples cores (NESTLEIND, ITC) for capital protection, plus three high-ROE growth satellites (SUPREMEIND, GRINDWELL, DIVISLAB) for compounding. Balances downside protection against growth for a moderate-risk family with a long but not unlimited horizon."),
 "pre-retirement":("Pre-Retirement Family","High-ROE Compounders",500000,
    ["NESTLEIND","MARICO","SUPREMEIND","ITC","COFORGE"],
    "The portfolio's quality core - the highest-ROE, lowest-debt compounders: NESTLEIND (ROE ~103%), MARICO (37%), SUPREMEIND (31%), ITC (22%, debt-free) and COFORGE (19%). Prioritises return consistency and balance-sheet strength over yield, suited to capital preservation with continued growth in the final working years."),
 "elderly-retired":("Elderly Retired Couple","Dividend Income",100000,
    ["ITC","BPCL","TECHM","MARICO","NESTLEIND"],
    "An income-and-stability mandate: the five highest-yield, lowest-volatility names - ITC (~10.7% trailing yield), BPCL (4.5%), TECHM (3.2%), MARICO (1.4%) and NESTLEIND (1.3%). Engineered for steady cash distributions and minimal drawdown for a corpus that must last."),
}
grid=[x["date"] for x in p["NESTLEIND"] if A<=x["date"]<=E]
def pmap(t): return {x["date"]:x["close"] for x in p[t]}

out=[]
for sid,(name,theme,cap,tickers,rat) in PORT.items():
    target=cap/len(tickers)
    holds=[[t,max(1,int(target//round(entry(t),2))),round(entry(t),2),round(at(p[t],E),2)] for t in tickers]
    def total(): return sum(q*en for _,q,en,_ in holds)
    while total()>cap:
        i=max(range(len(holds)),key=lambda i:holds[i][1]*holds[i][2])
        if holds[i][1]<=1: break
        holds[i][1]-=1
    ev=sum(q*en for _,q,en,_ in holds); xv=sum(q*ex for _,q,_,ex in holds)
    stocks=[dict(ticker=t,quantity=q,weight_pct=round(q*en/ev*100,1),entry_price=en,exit_price=ex,
                 stock_return_pct=ret(t)) for t,q,en,ex in holds]
    tr=round((xv/ev-1)*100,1)
    maps={t:pmap(t) for t,_,_,_ in holds}
    series=[{"date":d,"value":round(sum(q*(maps[t].get(d,en)) for t,q,en,_ in holds)/ev*100,2)} for d in grid]
    out.append(dict(scenarioId=sid,scenario=name,theme=theme,capital=cap,stocks=stocks,
        portfolio_entry_value=round(ev,2),portfolio_exit_value=round(xv,2),
        portfolio_total_return_pct=tr,vs_nifty_pct_points=round(tr-NIFTY,1),
        monthly_indexed_series=series,selection_rationale=rat))
    print(f"{name:26} [{theme:20}] ret={tr}% vsNifty={round(tr-NIFTY,1)}pp  {[h[0] for h in holds]}")

json.dump(out,open("data/ideal-portfolios.json","w"),indent=1)
json.dump({"elig":elig,"pool":list(pool)},open("data/_elig.json","w"),indent=1)
print("WROTE data/ideal-portfolios.json")
