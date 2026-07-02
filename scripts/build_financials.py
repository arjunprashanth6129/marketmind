#!/usr/bin/env python3
"""Rebuild data/financials.json {ticker:{FY2015..FY2021:{revenue,netProfit,eps,cfo}}}
by re-parsing the cached screener.in HTML. Handles Dec-fiscal-year companies
(FY{Y} = Dec {Y-1}) vs March companies (FY{Y} = Mar {Y})."""
import json, os
from bs4 import BeautifulSoup

s=json.load(open("data/screener.json"))
TICKERS=list(s.keys())

def num(x):
    if x is None: return None
    x=x.replace(",","").replace("%","").replace("₹","").strip()
    if x in ("","-",""): return None
    try: return float(x)
    except: return None

def parse_section(soup,secid):
    sec=soup.select_one("#"+secid)
    if not sec: return None,None
    t=sec.find("table")
    if not t or not t.find("thead"): return None,None
    heads=[th.get_text(strip=True) for th in t.find("thead").find_all("th")]
    rows={}
    for tr in t.find("tbody").find_all("tr"):
        tds=tr.find_all("td")
        if not tds: continue
        lab=tds[0].get_text(strip=True).rstrip("+").strip()
        rows[lab]={heads[j]:tds[j].get_text(strip=True) for j in range(1,len(tds)) if j<len(heads)}
    return heads,rows

def getrow(rows,opts,col):
    if rows is None or col is None: return None
    for o in opts:
        for k in rows:
            if k.lower()==o.lower(): return num(rows[k].get(col))
    for o in opts:
        for k in rows:
            if o.lower() in k.lower(): return num(rows[k].get(col))
    return None

def load_soup(t,view):
    for suf in ([ "cons","std"] if view=="consolidated" else ["std","cons"]):
        fn=f"data/cache/{t}_{suf}.html"
        if os.path.exists(fn):
            return BeautifulSoup(open(fn,encoding="utf-8").read(),"lxml")
    return None

out={}
for t in TICKERS:
    rec=s[t]
    soup=load_soup(t, rec.get("view","consolidated"))
    if soup is None:
        out[t]={f"FY{y}":None for y in range(2015,2022)}; print(t,"NO CACHE"); continue
    _,pl=parse_section(soup,"profit-loss")
    _,cf=parse_section(soup,"cash-flow")
    dec = (rec.get("fy_col")=="Dec 2020")
    fy={}
    for Y in range(2015,2022):
        col = f"Dec {Y-1}" if dec else f"Mar {Y}"
        rev=getrow(pl,["Sales","Revenue"],col)
        npf=getrow(pl,["Net Profit"],col)
        eps=getrow(pl,["EPS in Rs","EPS"],col)
        cfo=getrow(cf,["Cash from Operating Activity"],col)
        if rev is None and npf is None and eps is None and cfo is None:
            fy[f"FY{Y}"]=None
        else:
            fy[f"FY{Y}"]={"revenue":rev,"netProfit":npf,"eps":eps,"cfo":cfo}
    out[t]=fy
    present=[y for y in fy if fy[y]]
    print(f"{t:11} dec={dec} years={len(present)} FY21={fy.get('FY2021')}")

json.dump(out,open("data/financials.json","w"),separators=(",",":"))
print("WROTE data/financials.json")
