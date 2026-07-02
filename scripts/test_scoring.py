#!/usr/bin/env python3
"""Faithful replica of lib/scoring.ts to validate scores for sample portfolios."""
import json, math
p=json.load(open("data/prices.json")); s=json.load(open("data/snapshot-2021.json"))
ideal={x["scenarioId"]:x for x in json.load(open("data/ideal-portfolios.json"))}
BAD={"RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND","ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"}
A,E="2021-06-01","2026-06-01"
def at(t,d): return next((x["close"] for x in p[t] if x["date"]==d),None)
def entry(t): return at(t,A) if at(t,A) is not None else s[t].get("effectiveEntry")

def fund(t):
    if t in BAD: return 0.0
    sn=s[t]; pts=0.0
    roe=sn["roe"]
    if roe is not None:
        pts+= 3 if roe>25 else 2 if roe>=15 else 1 if roe>=5 else 0
    cfo_pos = "FY2021" not in (sn.get("cfoNegativeYears") or [])
    if cfo_pos: pts+=2
    de=sn["debtToEquity"]
    if de is None:
        if roe is not None and roe>=10 and cfo_pos: pts+=1
    elif de<0.3: pts+=2
    elif de<=1.0: pts+=1
    rev=sn["revenueGrowth3yr"]; prof=sn["profitGrowth3yr"]; note=sn["epsConsistencyNote"] or ""
    tracks=("in line" in note.lower()) or ("tracks net profit" in note.lower())
    loss="loss-making" in note.lower()
    if loss or (rev is not None and rev<0) or (prof is not None and prof<0): pass
    elif rev is not None and prof is not None and rev>0 and prof>0 and tracks: pts+=2
    else: pts+=1
    pr=sn["promoterHolding"]
    if pr is not None and pr>50: pts+=1
    elif pr is not None and pr>=25: pts+=0.5
    return min(10.0,pts)

def perf(ret,ideal_ret):
    if ret<0: return 0
    if ideal_ret<=0: return 10
    rel=ret/ideal_ret
    return 10 if rel>=1 else max(1,math.floor(rel*10))

def portfolio_return(holds):
    ev=sum(q*entry(t) for t,q in holds); xv=sum(q*at(t,E) for t,q in holds)
    return (xv/ev-1)*100, ev, xv

SAMPLES={
 "fresh-graduate":[("VBL",1),("TATAMOTORS",1),("COFORGE",1),("ZENSARTECH",1),("RPOWER",1)],
 "newly-married":[("HDFCBANK",1),("RELIANCE",1),("SUPREMEIND",1),("GRINDWELL",1),("ZENSARTECH",1)],
 "young-family":[("NESTLEIND",1),("ITC",1),("MARICO",1),("HAVELLS",1),("DRREDDY",1)],
 "pre-retirement":[("HDFCBANK",1),("KOTAKBANK",1),("NESTLEIND",1),("ITC",1),("RELIANCE",1)],
 "elderly-retired":[("ITC",1),("BPCL",1),("NESTLEIND",1),("ZEEL",1),("HCLTECH",1)],
}
# allocate whole shares ~ equal weight within capital
def alloc(sid,tickers):
    cap=ideal[sid]["capital"]; tgt=cap/len(tickers); out=[]
    for t,_ in tickers:
        q=max(1,int(tgt//entry(t))); out.append((t,q))
    while sum(q*entry(t) for t,q in out)>cap:
        i=max(range(len(out)),key=lambda i:out[i][1]*entry(out[i][0]))
        if out[i][1]<=1: break
        out[i]=(out[i][0],out[i][1]-1)
    return out

print(f"{'SCENARIO':16} ideal%   port%   PERF  FUND  FINAL   per-stock fundamentals")
for sid,tk in SAMPLES.items():
    holds=alloc(sid,tk); iret=ideal[sid]["portfolio_total_return_pct"]
    ret,ev,xv=portfolio_return(holds)
    pf=perf(ret,iret); fundavg=sum(fund(t) for t,_ in holds)/len(holds)
    final=round(pf*0.5+fundavg*0.5,1)
    fs=" ".join(f"{t}:{fund(t):g}" for t,_ in holds)
    print(f"{sid:16} {iret:6.1f} {ret:7.1f}  {pf:4}  {round(fundavg,1):4}  {final:5}   {fs}")
