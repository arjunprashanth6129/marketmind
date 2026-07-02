#!/usr/bin/env python3
"""Independent yfinance pipeline: adjusted prices/returns, splits, RAW Jun-2021
price, historical shares (Jun 2021), TTM dividend, company name."""
import json, os
import pandas as pd
import yfinance as yf

GOOD = ["BIOCON","ASTRAL","HDFCBANK","CYIENT","MPHASIS","KOTAKBANK","GARFIBRES","DRREDDY",
        "GODREJCP","KAJARIACER","HAVELLS","AMBUJACEM","COLPAL","ADANIGREEN","VOLTAS",
        "RELIANCE","HCLTECH","JYOTHYLAB","CIPLA","BAJAJFINSV","CERA","TECHM","BRITANNIA",
        "TATACONSUM","ZENSARTECH","DIVISLAB","BAJFINANCE","MARICO","NESTLEIND","SUPREMEIND",
        "SUNDARMFIN","GRINDWELL","RPOWER","AXISBANK","ITC","COFORGE","BPCL","YESBANK","VBL","INFY"]
BAD = ["RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND","ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"]

SECTOR = {
 "BIOCON":"Pharma/Biotech","ASTRAL":"Plastics/Pipes","HDFCBANK":"Banks","CYIENT":"IT Services/Engineering",
 "MPHASIS":"IT Services","KOTAKBANK":"Banks","GARFIBRES":"Textiles/Technical Fibres","DRREDDY":"Pharma",
 "GODREJCP":"FMCG","KAJARIACER":"Tiles/Building Mat.","HAVELLS":"Consumer Durables","AMBUJACEM":"Cement",
 "COLPAL":"FMCG","ADANIGREEN":"Renewable Power","VOLTAS":"Consumer Durables","RELIANCE":"Oil & Gas/Diversified",
 "HCLTECH":"IT Services","JYOTHYLAB":"FMCG","CIPLA":"Pharma","BAJAJFINSV":"Financial Services","CERA":"Sanitaryware",
 "TECHM":"IT Services","BRITANNIA":"FMCG","TATACONSUM":"FMCG","ZENSARTECH":"IT Services","DIVISLAB":"Pharma",
 "BAJFINANCE":"NBFC","MARICO":"FMCG","NESTLEIND":"FMCG","SUPREMEIND":"Plastics","SUNDARMFIN":"NBFC",
 "GRINDWELL":"Abrasives/Industrial","RPOWER":"Power","AXISBANK":"Banks","ITC":"FMCG/Diversified",
 "COFORGE":"IT Services","BPCL":"Oil & Gas","YESBANK":"Banks","VBL":"Beverages","INFY":"IT Services",
 "RAJESHEXPO":"Jewellery","JPASSOCIAT":"Infra/Cement","RELAXO":"Footwear","AAVAS":"Housing Finance",
 "AARTIIND":"Specialty Chemicals","ZEEL":"Media","GUJGASLTD":"Gas Distribution","IGL":"Gas Distribution",
 "PAYTM":"Fintech","WIPRO":"IT Services",
}

A21 = pd.Timestamp("2021-06-30")
START, END = "2021-05-20", "2026-06-19"

def nearest(s, anchor):
    if s.empty: return None, None
    pos = (s.index - anchor).to_series().abs().values.argmin()
    return s.index[pos], float(s.iloc[pos])

def series_close(df):
    c = df["Close"]
    if isinstance(c, pd.DataFrame): c = c.iloc[:,0]
    return c.dropna()

out = {}
allt = [(t,"GOOD") for t in GOOD] + [(t,"BAD") for t in BAD]
for i,(t,grp) in enumerate(allt,1):
    sym = t+".NS"
    r = {"ticker":t, "group":grp, "sector":SECTOR[t]}
    try:
        adj = yf.download(sym, start=START, end=END, auto_adjust=True, progress=False, threads=False)
        raw = yf.download(sym, start=START, end=END, auto_adjust=False, progress=False, threads=False)
        ca = series_close(adj); cr = series_close(raw)
        if ca.empty:
            r["status"]="NO DATA"; out[t]=r; print(i,t,"NO DATA"); continue
        first = ca.index.min()
        r["first_date"]=str(first.date())
        d21,p21 = nearest(ca, A21)
        d26,p26 = nearest(ca, ca.index.max())
        _,raw21 = nearest(cr, A21)
        r["adj_2021_date"]=str(d21.date()); r["adj_2021"]=round(p21,2)
        r["adj_2026_date"]=str(d26.date()); r["adj_2026"]=round(p26,2)
        r["raw_2021"]=round(raw21,2) if raw21 else None
        if first > pd.Timestamp("2021-08-10"):
            r["status"]="NOT LISTED BY JUN 2021"
            r["return_pct"]=None
        else:
            r["return_pct"]=round((p26-p21)/p21*100,1)
            r["status"]="OK"
        tk = yf.Ticker(sym)
        # splits in window
        try:
            sp = tk.splits
            if sp is not None and not sp.empty:
                tz=sp.index.tz
                sp = sp[(sp.index>=pd.Timestamp("2021-06-01",tz=tz))&(sp.index<=pd.Timestamp("2026-06-19",tz=tz))]
                r["splits"]= "; ".join(f"{x.date()} {v:g}:1" for x,v in sp.items()) if not sp.empty else None
        except Exception: r["splits"]=None
        # historical shares Jun 2021
        shares=None
        try:
            sh=tk.get_shares_full(start="2021-01-01",end="2021-12-31")
            if sh is not None and not sh.empty:
                idx=sh.index.tz_localize(None)
                pos=(idx-A21).to_series().abs().values.argmin()
                shares=float(sh.iloc[pos]); r["shares_2021_src"]="get_shares_full "+str(idx[pos].date())
        except Exception: pass
        r["shares_2021"]=shares
        if shares and r.get("raw_2021"):
            r["mcap_cr_2021"]=round(r["raw_2021"]*shares/1e7,0)
        else:
            r["mcap_cr_2021"]=None
        # TTM dividend (Jul 2020 - Jun 2021) for div yield
        try:
            dv=tk.dividends
            if dv is not None and not dv.empty:
                dvi=dv.index.tz_localize(None)
                mask=(dvi>=pd.Timestamp("2020-07-01"))&(dvi<=A21)
                r["ttm_div_2021"]=round(float(dv[mask.values].sum()),3)
            else:
                r["ttm_div_2021"]=0.0
        except Exception:
            r["ttm_div_2021"]=None
        # company name
        try:
            info=tk.info
            r["yf_name"]=info.get("longName") or info.get("shortName")
        except Exception:
            r["yf_name"]=None
    except Exception as e:
        r["status"]="ERR "+str(e)[:60]
    out[t]=r
    print(i,t,r.get("status"),"ret=",r.get("return_pct"),"mcap=",r.get("mcap_cr_2021"))

# Benchmark
try:
    adj=yf.download("^NSEI",start=START,end=END,auto_adjust=True,progress=False,threads=False)
    c=series_close(adj); d21,p21=nearest(c,A21); d26,p26=nearest(c,c.index.max())
    out["^NSEI"]={"ticker":"^NSEI","adj_2021_date":str(d21.date()),"adj_2021":round(p21,2),
                  "adj_2026_date":str(d26.date()),"adj_2026":round(p26,2),
                  "return_pct":round((p26-p21)/p21*100,1)}
    print("NIFTY", out["^NSEI"])
except Exception as e: print("NIFTY ERR",e)

os.makedirs("data",exist_ok=True)
json.dump(out, open("data/yf.json","w"), indent=2)
print("WROTE data/yf.json")
