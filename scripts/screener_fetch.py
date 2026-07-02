#!/usr/bin/env python3
"""Scrape screener.in FY2021 (Mar 2021) fundamentals for the 50-ticker universe.
Caches HTML to data/cache/, 2s delay between LIVE requests, normal UA.
Parses P&L, balance sheet, cash flow, ratios, shareholding(yearly)."""
import json, os, time, re
import requests
from bs4 import BeautifulSoup

TICKERS = ["BIOCON","ASTRAL","HDFCBANK","CYIENT","MPHASIS","KOTAKBANK","GARFIBRES","DRREDDY",
 "GODREJCP","KAJARIACER","HAVELLS","AMBUJACEM","COLPAL","ADANIGREEN","VOLTAS","RELIANCE","HCLTECH",
 "JYOTHYLAB","CIPLA","BAJAJFINSV","CERA","TECHM","BRITANNIA","TATACONSUM","ZENSARTECH","DIVISLAB",
 "BAJFINANCE","MARICO","NESTLEIND","SUPREMEIND","SUNDARMFIN","GRINDWELL","RPOWER","AXISBANK","ITC",
 "COFORGE","BPCL","YESBANK","VBL","INFY","RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND",
 "ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"]

HEAD={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept-Language':'en-US,en;q=0.9'}
os.makedirs("data/cache",exist_ok=True)

def fetch(url, cache_path):
    if os.path.exists(cache_path):
        return open(cache_path,encoding='utf-8').read(), False
    r=requests.get(url,headers=HEAD,timeout=40)
    if r.status_code==200 and len(r.text)>5000:
        open(cache_path,'w',encoding='utf-8').write(r.text)
        return r.text, True
    return None, True

def num(s):
    if s is None: return None
    s=s.replace(',','').replace('%','').replace('₹','').strip()
    if s in ('','-',''): return None
    try: return float(s)
    except: return None

def parse_section(soup, secid):
    """Return list of (rowlabel, {colheader:rawtext}) and the header list."""
    sec=soup.select_one('#'+secid)
    if not sec: return None,None
    t=sec.find('table')
    if not t or not t.find('thead'): return None,None
    heads=[th.get_text(strip=True) for th in t.find('thead').find_all('th')]
    rows={}
    for tr in t.find('tbody').find_all('tr'):
        tds=tr.find_all('td')
        if not tds: continue
        label=tds[0].get_text(strip=True).rstrip('+').strip()
        vals={}
        for j,td in enumerate(tds[1:],1):
            if j < len(heads):
                vals[heads[j]]=td.get_text(strip=True)
        rows[label]=vals
    return heads, rows

def get_cell(rows, label_options, col):
    if rows is None: return None
    for lab in label_options:
        for k in rows:
            if k.lower()==lab.lower():
                return num(rows[k].get(col))
    # contains match
    for lab in label_options:
        for k in rows:
            if lab.lower() in k.lower():
                return num(rows[k].get(col))
    return None

def choose_cols(heads):
    """Pick (fy_col, base_col) for FY2021 and FY2018 across Mar- or Dec-year cos."""
    for fy,base in [("Mar 2021","Mar 2018"),("Dec 2020","Dec 2017")]:
        if fy in heads:
            return fy, (base if base in heads else None)
    return None,None

def shareholding_table(soup, fy_pref):
    """Pick the shareholding table containing a column near mid-2021."""
    sec=soup.select_one('#shareholding')
    if not sec: return None,None
    cands=["Mar 2021","Jun 2021","Dec 2020","Dec 2021"]
    if fy_pref and fy_pref not in cands: cands.insert(0,fy_pref)
    for t in sec.find_all('table'):
        if not t.find('thead'): continue
        heads=[th.get_text(strip=True) for th in t.find('thead').find_all('th')]
        hit=next((c for c in cands if c in heads), None)
        if hit:
            rows={}
            for tr in t.find('tbody').find_all('tr'):
                tds=tr.find_all('td')
                if not tds: continue
                label=tds[0].get_text(strip=True).rstrip('+').strip()
                rows[label]={heads[j]:tds[j].get_text(strip=True) for j in range(1,len(tds)) if j<len(heads)}
            return rows, hit
    return None,None

out={}
for i,t in enumerate(TICKERS,1):
    rec={"ticker":t}
    html=None; used=None; live=False; fy=base=None; fallback=None
    for suffix in ["consolidated/",""]:
        url=f"https://www.screener.in/company/{t}/{suffix}"
        cp=f"data/cache/{t}_{'cons' if suffix else 'std'}.html"
        h,was_live=fetch(url,cp)
        if was_live: live=True
        if h:
            soup=BeautifulSoup(h,'lxml')
            heads,pl=parse_section(soup,'profit-loss')
            if pl and heads:
                fyc,basec=choose_cols(heads)
                if fyc:
                    html=h; used=suffix or "standalone"; fy,base=fyc,basec; break
                if fallback is None:
                    fallback=(h, suffix or "standalone")  # has P&L but no FY2021 col
    if not html and fallback:
        html,used=fallback
        soup=BeautifulSoup(html,'lxml'); heads,_=parse_section(soup,'profit-loss')
        fy,base=choose_cols(heads)
    if not html:
        rec["error"]="no usable screener page"
        out[t]=rec
        print(i,t,"NO PAGE");
        if live: time.sleep(2)
        continue
    soup=BeautifulSoup(html,'lxml')
    rec["view"]="consolidated" if used=="consolidated/" else "standalone"
    # company name from h1
    h1=soup.find('h1')
    rec["screener_name"]=h1.get_text(strip=True) if h1 else None
    # top ratios (current) - capture face value & current PE for reference
    tr=soup.select_one('#top-ratios')
    topr={}
    if tr:
        for li in tr.find_all('li'):
            n=li.select_one('.name'); v=li.select_one('.value')
            if n and v: topr[n.get_text(strip=True)]=' '.join(v.get_text(strip=True).split())
    rec["face_value"]=num(topr.get('Face Value'))
    _,pl=parse_section(soup,'profit-loss')
    _,bs=parse_section(soup,'balance-sheet')
    _,cf=parse_section(soup,'cash-flow')
    sh,sh_col=shareholding_table(soup, fy)
    C21,C18=fy,base
    rec["fy_col"]=fy; rec["base_col"]=base; rec["sh_col"]=sh_col
    rec["sales_2021"]=get_cell(pl,["Sales","Revenue"],C21)
    rec["sales_2018"]=get_cell(pl,["Sales","Revenue"],C18) if C18 else None
    rec["np_2021"]=get_cell(pl,["Net Profit"],C21)
    rec["np_2018"]=get_cell(pl,["Net Profit"],C18) if C18 else None
    rec["eps_2021"]=get_cell(pl,["EPS in Rs","EPS"],C21)
    rec["eps_2018"]=get_cell(pl,["EPS in Rs","EPS"],C18) if C18 else None
    rec["opm_2021"]=get_cell(pl,["OPM %","OPM"],C21)
    rec["equity_capital_2021"]=get_cell(bs,["Equity Capital"],C21)
    rec["reserves_2021"]=get_cell(bs,["Reserves"],C21)
    rec["borrowings_2021"]=get_cell(bs,["Borrowings","Borrowing"],C21)
    rec["cfo_2021"]=get_cell(cf,["Cash from Operating Activity"],C21)
    rec["promoter_2021"]=get_cell(sh,["Promoters"],sh_col) if sh else None
    out[t]=rec
    flags=[k for k in ["sales_2021","np_2021","eps_2021","cfo_2021","promoter_2021"] if rec.get(k) is None]
    print(i,t,rec["view"],"miss:",flags)
    if live: time.sleep(2)

json.dump(out,open("data/screener.json","w"),indent=2)
print("WROTE data/screener.json")
