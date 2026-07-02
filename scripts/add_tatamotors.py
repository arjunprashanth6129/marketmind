#!/usr/bin/env python3
"""Add TATAMOTORS to the universe. Tata Motors demerged in 2025 into TMPV
(Passenger Vehicles, the continuing entity that carries the legacy price +
financial history) and TMCV (Commercial Vehicles, 1:1 spin-off listed Nov 2025).
auto_adjust does NOT correct demergers, so the buy-and-hold value series is
reconstructed as TMPV + TMCV after the demerger."""
import json, os, time
import pandas as pd, yfinance as yf, requests
from bs4 import BeautifulSoup

A=pd.Timestamp("2021-06-30")
SHARES_2021 = 3.834e9   # Tata Motors ordinary shares outstanding, Jun 2021 (~383.4 cr)

def sc(df):
    c=df["Close"]
    if hasattr(c,"columns"): c=c.iloc[:,0]
    return c.dropna()

def monthly(sym,start="2003-01-01"):
    d=yf.download(sym,start=start,end="2026-06-19",interval="1mo",auto_adjust=True,progress=False,threads=False)
    return sc(d)

# ---- price series (combined, demerger-adjusted) ----
tmpv_m=monthly("TMPV.NS")
tmcv_m=monthly("TMCV.NS","2025-10-01")
tmcv_first=float(tmcv_m.iloc[0])
def key(ts): return f"{ts.year:04d}-{ts.month:02d}-01"
tmcv_by={key(t):float(v) for t,v in tmcv_m.items()}
DEMERGER="2025-10"  # month TMPV drops to PV-only; TMCV starts trading Nov
series=[]
seen={}
for t,v in tmpv_m.items():
    k=key(t); val=float(v)
    if k[:7]>=DEMERGER:  # PV stub -> add CV value the 1:1 holder also owns
        val += tmcv_by.get(k, tmcv_first)
    seen[k]=round(val,2)
series=[{"date":k,"close":seen[k]} for k in sorted(seen)]

# ---- verified daily anchors ----
tmpv_d=sc(yf.download("TMPV.NS",start="2021-05-20",end="2026-06-19",auto_adjust=True,progress=False,threads=False))
tmcv_d=sc(yf.download("TMCV.NS",start="2025-10-01",end="2026-06-19",auto_adjust=True,progress=False,threads=False))
pos=(tmpv_d.index-A).to_series().abs().values.argmin()
adj_2021=round(float(tmpv_d.iloc[pos]),2)            # whole company, Jun 2021
adj_2026=round(float(tmpv_d.iloc[-1])+float(tmcv_d.iloc[-1]),2)  # PV stub + CV spin-off
ret=round((adj_2026/adj_2021-1)*100,1)
raw_2021=adj_2021
# pin anchors
am={p["date"]:p for p in series}
am.setdefault("2021-06-01",{"date":"2021-06-01","close":0})["close"]=adj_2021
am.setdefault("2026-06-01",{"date":"2026-06-01","close":0})["close"]=adj_2026
series=[am[k] for k in sorted(am)]
print(f"PRICE: Jun2021={adj_2021}  Jun2026(TMPV {round(float(tmpv_d.iloc[-1]),1)}+TMCV {round(float(tmcv_d.iloc[-1]),1)})={adj_2026}  return={ret}%")

# ---- screener fundamentals (TMPV consolidated carries legacy Tata Motors history) ----
HEAD={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
cp="data/cache/TATAMOTORS_cons.html"
if os.path.exists(cp):
    html=open(cp,encoding="utf-8").read()
else:
    html=requests.get("https://www.screener.in/company/TMPV/consolidated/",headers=HEAD,timeout=40).text
    open(cp,"w",encoding="utf-8").write(html); time.sleep(2)
soup=BeautifulSoup(html,"lxml")
def num(x):
    if x is None: return None
    x=x.replace(",","").replace("%","").replace("₹","").strip()
    if x in ("","-",""): return None
    try: return float(x)
    except: return None
def section(secid):
    sec=soup.select_one("#"+secid); t=sec.find("table") if sec else None
    if not t or not t.find("thead"): return None,None
    heads=[th.get_text(strip=True) for th in t.find("thead").find_all("th")]
    rows={}
    for tr in t.find("tbody").find_all("tr"):
        tds=tr.find_all("td")
        if not tds: continue
        rows[tds[0].get_text(strip=True).rstrip("+").strip()]={heads[j]:tds[j].get_text(strip=True) for j in range(1,len(tds)) if j<len(heads)}
    return heads,rows
def cell(rows,opts,col):
    if rows is None: return None
    for o in opts:
        for k in rows:
            if k.lower()==o.lower(): return num(rows[k].get(col))
    for o in opts:
        for k in rows:
            if o.lower() in k.lower(): return num(rows[k].get(col))
    return None
_,pl=section("profit-loss"); _,bs=section("balance-sheet"); _,cf=section("cash-flow")
# yearly shareholding
prom=None
sh=soup.select_one("#shareholding")
if sh:
    for t in sh.find_all("table"):
        heads=[th.get_text(strip=True) for th in t.find("thead").find_all("th")]
        if "Mar 2021" in heads:
            for tr in t.find("tbody").find_all("tr"):
                tds=tr.find_all("td")
                if tds and "promoter" in tds[0].get_text().lower():
                    prom=num(tds[heads.index("Mar 2021")].get_text(strip=True))
fin={}
for Y in range(2015,2022):
    col=f"Mar {Y}"
    rev=cell(pl,["Sales","Revenue"],col); npf=cell(pl,["Net Profit"],col)
    eps=cell(pl,["EPS in Rs","EPS"],col); cfo=cell(cf,["Cash from Operating Activity"],col)
    fin[f"FY{Y}"]= None if (rev is None and npf is None and eps is None and cfo is None) else {"revenue":rev,"netProfit":npf,"eps":eps,"cfo":cfo}
eqcap=cell(bs,["Equity Capital"],"Mar 2021"); res=cell(bs,["Reserves"],"Mar 2021")
borrow=cell(bs,["Borrowings","Borrowing"],"Mar 2021")
equity=(eqcap or 0)+(res or 0)
np21=cell(pl,["Net Profit"],"Mar 2021"); eps21=cell(pl,["EPS in Rs","EPS"],"Mar 2021"); opm21=cell(pl,["OPM %","OPM"],"Mar 2021")
sales21=cell(pl,["Sales","Revenue"],"Mar 2021"); sales18=cell(pl,["Sales","Revenue"],"Mar 2018"); np18=cell(pl,["Net Profit"],"Mar 2018")
def cagr(a,b,n):
    if a is None or b is None or a<=0 or b<=0: return None
    return round(((b/a)**(1/n)-1)*100,1)
roe=round(np21/equity*100,1) if (np21 is not None and equity>0) else None
de=round(borrow/equity,2) if (borrow is not None and equity>0) else None
pe=round(raw_2021/eps21,1) if (eps21 and eps21>0) else None
mcap=round(raw_2021*SHARES_2021/1e7)
cat="Large" if mcap>20000 else "Mid" if mcap>=5000 else "Small"
cfo_neg=[f"FY{y}" for y in range(2015,2022) if (fin.get(f"FY{y}") and fin[f"FY{y}"]["cfo"] is not None and fin[f"FY{y}"]["cfo"]<0)]
note = "FY2018 or FY2021 loss-making - EPS-vs-profit growth comparison not meaningful." if (np18 is None or np18<=0 or (np21 is not None and np21<0)) else "EPS broadly tracks net profit."

snap={
 "name":"Tata Motors",
 "companyBlurb":"Tata Motors is an Indian automaker that designs and sells passenger and commercial vehicles and, through its Jaguar Land Rover subsidiary, luxury cars worldwide. It operates in the Automobile sector as the flagship auto company of the Tata group. As of June 2021 it was one of India's largest vehicle makers by revenue, with earnings heavily influenced by its global JLR business.",
 "sector":"Auto",
 "price":adj_2021,"ipoMonth":None,"effectiveEntry":adj_2021,"negNetWorth":equity<0,
 "marketCap":mcap,"marketCapCategory":cat,"pe":pe,
 "dividendYield":0.0,"roe":(None if equity<0 else roe),"debtToEquity":(None if equity<0 else de),
 "promoterHolding":prom,"promoterHoldingAsOf":("2021" if prom is not None else None),
 "gpm":None,"opm":opm21,"eps":eps21,
 "revenueGrowth3yr":cagr(sales18,sales21,3),"revenueGrowth5yr":cagr(cell(pl,["Sales","Revenue"],"Mar 2016"),sales21,5),
 "profitGrowth3yr":cagr(np18,np21,3),"profitGrowth5yr":cagr(cell(pl,["Net Profit"],"Mar 2016"),np21,5),
 "epsConsistencyNote":note,"cfoNegativeYears":cfo_neg,
}
print("SNAP:",json.dumps({k:snap[k] for k in ['marketCap','marketCapCategory','pe','roe','debtToEquity','dividendYield','opm','eps','promoterHolding','revenueGrowth3yr','profitGrowth3yr']},indent=0))
print("FIN FY2021:",fin["FY2021"]," years:",[y for y in fin if fin[y]])
print("corp actions: 2025 demerger into TMPV(PV)+TMCV(CV) 1:1; 2024 DVR-class cancellation (ordinary holders unaffected); no ordinary split in window")

# ---- inject into data files ----
p=json.load(open("data/prices.json")); p["TATAMOTORS"]=series; json.dump(p,open("data/prices.json","w"),separators=(",",":"))
f=json.load(open("data/financials.json")); f["TATAMOTORS"]=fin; json.dump(f,open("data/financials.json","w"),separators=(",",":"))
s=json.load(open("data/snapshot-2021.json")); s["TATAMOTORS"]=snap; json.dump(s,open("data/snapshot-2021.json","w"),indent=1,ensure_ascii=False)
print(f"INJECTED. prices={len(p)} financials={len(f)} snapshot={len(s)}")
