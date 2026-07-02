#!/usr/bin/env python3
"""Pin the two simulator anchor months (2021-06-01, 2026-06-01) to the verified
daily adj_2021/adj_2026 from yf.json so app returns match the verified report
exactly. Intermediate monthly points untouched (chart shape only)."""
import json
prices=json.load(open("data/prices.json"))
nifty=json.load(open("data/nifty.json"))
yf=json.load(open("data/yf.json"))

def setpt(series, date, close):
    for p in series:
        if p["date"]==date:
            p["close"]=round(close,2); return
    series.append({"date":date,"close":round(close,2)})
    series.sort(key=lambda x:x["date"])

ref={"BIOCON":3.4,"HDFCBANK":12.1,"RELIANCE":38.9,"NESTLEIND":67.1,"VBL":454.5,
     "INFY":-18.1,"YESBANK":88.0,"RAJESHEXPO":-83.5,"WIPRO":-27.5}

for t,series in prices.items():
    yd=yf[t]
    a21=yd.get("adj_2021"); a26=yd.get("adj_2026")
    if t=="PAYTM":
        # not listed Jun 2021: pin listing month (Nov 2021) + exit
        setpt(series,"2021-11-01",a21)
        setpt(series,"2026-06-01",a26)
        continue
    if a21 is not None: setpt(series,"2021-06-01",a21)
    if a26 is not None: setpt(series,"2026-06-01",a26)

# nifty verified anchors
setpt(nifty,"2021-06-01",15721.5)
setpt(nifty,"2026-06-01",24168.0)

json.dump(prices,open("data/prices.json","w"),separators=(",",":"))
json.dump(nifty,open("data/nifty.json","w"),separators=(",",":"))

# verify
print("=== spot-check vs reference table ===")
def at(series,d): return next((p["close"] for p in series if p["date"]==d),None)
for t,exp in ref.items():
    s=prices[t]; p21=at(s,"2021-06-01"); p26=at(s,"2026-06-01")
    r=round((p26/p21-1)*100,1)
    ok="OK" if abs(r-exp)<=0.6 else "**CHECK**"
    print(f"{t:11} {p21} -> {p26}  ret={r:+.1f}% (ref {exp:+.1f}) {ok}")
nj=round((at(nifty,'2026-06-01')/at(nifty,'2021-06-01')-1)*100,1)
print(f"NIFTY ret={nj}% (ref +53.7%)")
print("PAYTM entry(2021-11):",at(prices['PAYTM'],'2021-11-01'),"exit:",at(prices['PAYTM'],'2026-06-01'))
