#!/usr/bin/env python3
"""Monthly auto_adjust=True price series for the 50-stock universe + ^NSEI.
Output schema matches the app: {ticker: [{date:'YYYY-MM-01', close}]}.
Monthly bar close = that month's last trading-day adjusted close (yfinance '1mo')."""
import json
import pandas as pd, yfinance as yf

GOOD=["BIOCON","ASTRAL","HDFCBANK","CYIENT","MPHASIS","KOTAKBANK","GARFIBRES","DRREDDY","GODREJCP",
 "KAJARIACER","HAVELLS","AMBUJACEM","COLPAL","ADANIGREEN","VOLTAS","RELIANCE","HCLTECH","JYOTHYLAB",
 "CIPLA","BAJAJFINSV","CERA","TECHM","BRITANNIA","TATACONSUM","ZENSARTECH","DIVISLAB","BAJFINANCE",
 "MARICO","NESTLEIND","SUPREMEIND","SUNDARMFIN","GRINDWELL","RPOWER","AXISBANK","ITC","COFORGE",
 "BPCL","YESBANK","VBL","INFY"]
BAD=["RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND","ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"]
ALL=GOOD+BAD

END="2026-06-19"
def monthly(sym):
    df=yf.download(sym,start="1999-12-01",end=END,interval="1mo",auto_adjust=True,progress=False,threads=False)
    if df is None or df.empty: return None
    c=df["Close"]
    if isinstance(c,pd.DataFrame): c=c.iloc[:,0]
    c=c.dropna()
    out=[]
    for ts,v in c.items():
        out.append({"date":f"{ts.year:04d}-{ts.month:02d}-01","close":round(float(v),2)})
    # dedupe by date keeping last
    seen={}
    for p in out: seen[p["date"]]=p["close"]
    return [{"date":d,"close":seen[d]} for d in sorted(seen)]

prices={}
for i,t in enumerate(ALL,1):
    s=monthly(t+".NS")
    if s is None:
        print(i,t,"NO DATA"); continue
    prices[t]=s
    jun21=next((p["close"] for p in s if p["date"]=="2021-06-01"),None)
    jun26=next((p["close"] for p in s if p["date"]=="2026-06-01"),None)
    print(f"{i:2} {t:11} n={len(s)} first={s[0]['date']} 2021-06={jun21} 2026-06={jun26}")
json.dump(prices,open("data/prices.json","w"),separators=(",",":"))
print("WROTE data/prices.json", len(prices),"tickers")

nif=monthly("^NSEI")
json.dump(nif,open("data/nifty.json","w"),separators=(",",":"))
j21=next((p["close"] for p in nif if p["date"]=="2021-06-01"),None)
j26=next((p["close"] for p in nif if p["date"]=="2026-06-01"),None)
print(f"NIFTY n={len(nif)} 2021-06={j21} 2026-06={j26} ret={round((j26/j21-1)*100,1)}%")
