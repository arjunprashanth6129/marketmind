#!/usr/bin/env python3
"""Build the eligible pool + 5 ideal scenario portfolios from verified data."""
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

# ---- ELIGIBILITY ----
# Filter 1: return > 53.7%.  Filter 2: sound FY2021 fundamentals.
elig={}; pool={}
for t in GOOD:
    r=ret(t); sn=s[t]; fy=f[t].get("FY2021") or {}
    cfo=fy.get("cfo"); npf=fy.get("netProfit"); roe=sn["roe"]; de=sn["debtToEquity"]
    note=sn["epsConsistencyNote"]; prom=sn["promoterHolding"]; cat=sn["marketCapCategory"]
    reasons=[]
    beats = r>NIFTY
    if not beats: reasons.append(f"return {r}% does not beat Nifty +53.7%")
    # fundamentals
    if npf is None or npf<0: reasons.append(f"FY2021 net profit not positive ({npf})")
    if roe is None or roe<12: reasons.append(f"ROE {roe}% not reasonably strong (>=12%)")
    if cfo is None or cfo<0: reasons.append(f"FY2021 CFO not positive ({cfo})")
    if "lags net-profit" in (note or "") or "loss-making" in (note or ""):
        reasons.append("EPS dilution / loss flag: "+note.split('—')[0].strip())
    # D/E: only flag for non-bank/NBFC with high debt; NBFC/bank high D/E justified if ROE>=12 & CFO>0
    is_lender = de is None or de>3
    if de is not None and de>1.5 and not is_lender:
        reasons.append(f"elevated D/E {de}")
    # promoter near-zero (ITC = no-promoter pro-managed, treated as justified)
    if prom is not None and prom<5 and t!="ITC":
        reasons.append(f"near-zero promoter holding {prom}%")
    fund_ok = not any(x for x in reasons if "Nifty" not in x)
    eligible = beats and fund_ok
    elig[t]=dict(ret=r,cat=cat,roe=roe,de=de,cfo=cfo,dy=sn["dividendYield"],beats=beats,
                 fund_ok=fund_ok,eligible=eligible,reasons=reasons,note=note,prom=prom)
    if eligible: pool[t]=elig[t]

poolL=[t for t in pool if pool[t]["cat"]=="Large"]
poolM=[t for t in pool if pool[t]["cat"]=="Mid"]
poolS=[t for t in pool if pool[t]["cat"]=="Small"]
print("ELIGIBLE POOL (%d): Large=%s Mid=%s Small=%s"%(len(pool),poolL,poolM,poolS))
print("EXCLUDED return-passers:")
for t in sorted(GOOD,key=lambda x:-elig[x]["ret"]):
    if elig[t]["beats"] and not elig[t]["eligible"]:
        print("  ",t,elig[t]["ret"],"->",[r for r in elig[t]["reasons"] if "Nifty" not in r])

# ---- PORTFOLIOS ----
PORT={
 "fresh-graduate":("Fresh Graduate",50000,["COFORGE","BPCL","GRINDWELL","ZENSARTECH","NESTLEIND"]),
 "newly-married":("Newly Married Couple",200000,["COFORGE","SUPREMEIND","DIVISLAB","GRINDWELL","ZENSARTECH"]),
 "young-family":("Young Family with Toddlers",300000,["NESTLEIND","ITC","MARICO","GRINDWELL","ZENSARTECH"]),
 "pre-retirement":("Pre-Retirement Family",500000,["NESTLEIND","MARICO","SUPREMEIND","ITC","BPCL"]),
 "elderly-retired":("Elderly Retired Couple",100000,["ITC","BPCL","TECHM","MARICO","NESTLEIND"]),
}
grid=[x["date"] for x in p["NESTLEIND"] if A<=x["date"]<=E]
def pmap(t): return {x["date"]:x["close"] for x in p[t]}

out=[]
for sid,(name,cap,tickers) in PORT.items():
    # whole shares, ~equal weight (target cap/n per stock)
    target=cap/len(tickers)
    holds=[]
    for t in tickers:
        en=round(entry(t),2); ex=round(at(p[t],E),2)
        qty=max(1,int(target//en))
        holds.append([t,qty,en,ex])
    # trim if over budget (reduce highest-cost holding's qty)
    def total(): return sum(q*en for _,q,en,_ in holds)
    while total()>cap:
        i=max(range(len(holds)),key=lambda i:holds[i][1]*holds[i][2])
        if holds[i][1]<=1: break
        holds[i][1]-=1
    ev=sum(q*en for _,q,en,_ in holds)
    xv=sum(q*ex for _,q,en,ex in holds)
    stocks=[]
    for t,q,en,ex in holds:
        stocks.append(dict(ticker=t,quantity=q,weight_pct=round(q*en/ev*100,1),
                           entry_price=en,exit_price=ex,stock_return_pct=ret(t)))
    tr=round((xv/ev-1)*100,1)
    maps={t:pmap(t) for t,_,_,_ in holds}
    series=[]
    for d in grid:
        val=sum(q*(maps[t].get(d, en)) for t,q,en,_ in holds)
        series.append({"date":d,"value":round(val/ev*100,2)})
    out.append(dict(scenarioId=sid,scenario=name,capital=cap,stocks=stocks,
        portfolio_entry_value=round(ev,2),portfolio_exit_value=round(xv,2),
        portfolio_total_return_pct=tr,vs_nifty_pct_points=round(tr-NIFTY,1),
        monthly_indexed_series=series))
    print(f"{name:26} n={len(stocks)} entry={round(ev)} exit={round(xv)} ret={tr}% vsNifty={round(tr-NIFTY,1)}pp  {[h[0] for h in holds]}")

json.dump(out,open("data/ideal-portfolios.json","w"),indent=1)
json.dump({"elig":elig,"pool":list(pool)},open("data/_elig.json","w"),indent=1)
print("WROTE data/ideal-portfolios.json")
