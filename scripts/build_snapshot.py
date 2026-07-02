#!/usr/bin/env python3
"""Rebuild data/snapshot-2021.json from verified yf.json + screener.json + financials.json."""
import json

yf=json.load(open("data/yf.json"))
s=json.load(open("data/screener.json"))
fin=json.load(open("data/financials.json"))

NAMES={
 "BIOCON":"Biocon","ASTRAL":"Astral","HDFCBANK":"HDFC Bank","CYIENT":"Cyient","MPHASIS":"Mphasis",
 "KOTAKBANK":"Kotak Mahindra Bank","GARFIBRES":"Garware Technical Fibres","DRREDDY":"Dr. Reddy's Laboratories",
 "GODREJCP":"Godrej Consumer Products","KAJARIACER":"Kajaria Ceramics","HAVELLS":"Havells India",
 "AMBUJACEM":"Ambuja Cements","COLPAL":"Colgate-Palmolive (India)","ADANIGREEN":"Adani Green Energy",
 "VOLTAS":"Voltas","RELIANCE":"Reliance Industries","HCLTECH":"HCL Technologies","JYOTHYLAB":"Jyothy Labs",
 "CIPLA":"Cipla","BAJAJFINSV":"Bajaj Finserv","CERA":"Cera Sanitaryware","TECHM":"Tech Mahindra",
 "BRITANNIA":"Britannia Industries","TATACONSUM":"Tata Consumer Products","ZENSARTECH":"Zensar Technologies",
 "DIVISLAB":"Divi's Laboratories","BAJFINANCE":"Bajaj Finance","MARICO":"Marico","NESTLEIND":"Nestle India",
 "SUPREMEIND":"Supreme Industries","SUNDARMFIN":"Sundaram Finance","GRINDWELL":"Grindwell Norton",
 "RPOWER":"Reliance Power","AXISBANK":"Axis Bank","ITC":"ITC","COFORGE":"Coforge","BPCL":"Bharat Petroleum",
 "YESBANK":"Yes Bank","VBL":"Varun Beverages","INFY":"Infosys","RAJESHEXPO":"Rajesh Exports",
 "JPASSOCIAT":"Jaiprakash Associates","RELAXO":"Relaxo Footwears","AAVAS":"Aavas Financiers",
 "AARTIIND":"Aarti Industries","ZEEL":"Zee Entertainment","GUJGASLTD":"Gujarat Gas",
 "IGL":"Indraprastha Gas","PAYTM":"Paytm (One97 Communications)","WIPRO":"Wipro",
}
SECTOR={}
for sec,ids in {
 "Banks":["HDFCBANK","KOTAKBANK","AXISBANK","YESBANK"],
 "IT Services":["CYIENT","MPHASIS","HCLTECH","TECHM","ZENSARTECH","COFORGE","WIPRO","INFY"],
 "Pharma/Biotech":["BIOCON","DRREDDY","CIPLA","DIVISLAB"],
 "FMCG":["GODREJCP","COLPAL","JYOTHYLAB","BRITANNIA","TATACONSUM","MARICO","NESTLEIND","ITC"],
 "NBFC/Financial Services":["BAJAJFINSV","BAJFINANCE","SUNDARMFIN","AAVAS"],
 "Consumer Durables":["HAVELLS","VOLTAS"],
 "Industrials/Building Materials":["ASTRAL","KAJARIACER","AMBUJACEM","SUPREMEIND","GRINDWELL","CERA"],
 "Energy/Oil & Gas":["RELIANCE","BPCL"],
 "Power/Utilities":["ADANIGREEN","RPOWER"],
 "Gas Distribution":["GUJGASLTD","IGL"],
 "Textiles":["GARFIBRES"],"Jewellery":["RAJESHEXPO"],"Infra/Cement":["JPASSOCIAT"],
 "Footwear":["RELAXO"],"Specialty Chemicals":["AARTIIND"],"Media":["ZEEL"],
 "Fintech":["PAYTM"],"Beverages":["VBL"],
}.items():
    for i in ids: SECTOR[i]=sec

MID={"CYIENT","GARFIBRES","KAJARIACER","JYOTHYLAB","CERA","ZENSARTECH","GRINDWELL","RAJESHEXPO"}
SMALL={"RPOWER","JPASSOCIAT"}
BANKS={"HDFCBANK","KOTAKBANK","AXISBANK","YESBANK"}

def cagr(a,b,n):
    if a is None or b is None or a<=0 or b<=0: return None
    return round(((b/a)**(1/n)-1)*100,1)

def fy(t,y,k):
    r=fin[t].get(f"FY{y}")
    return r[k] if r else None

def eps_note(t):
    np18=fy(t,2018,"netProfit"); np21=fy(t,2021,"netProfit")
    e18=fy(t,2018,"eps"); e21=fy(t,2021,"eps")
    if e18 is None or e21 is None: return "EPS history unavailable for FY2018-FY2021 (recent listing or fiscal change)."
    if np18 is None or np18<=0 or (np21 is not None and np21<0):
        return "FY2018 or FY2021 loss-making - EPS-vs-profit growth comparison not meaningful."
    npc=cagr(np18,np21,3); epc=cagr(e18,e21,3)
    if npc is None or epc is None: return "Not enough data to assess EPS consistency."
    gap=npc-epc
    if abs(gap)<2: return "EPS grew broadly in line with net profit - no material equity dilution."
    if gap>0: return f"EPS CAGR {epc:.0f}% lags net-profit CAGR {npc:.0f}% - possible equity dilution."
    return f"EPS CAGR {epc:.0f}% exceeds net-profit CAGR {npc:.0f}% - share count reduced (buyback)."

out={}
for t in NAMES:
    yd=yf[t]; sd=s[t]
    eqcap=sd.get("equity_capital_2021"); res=sd.get("reserves_2021")
    equity=(eqcap or 0)+(res or 0)
    neg = equity<0
    borrow=sd.get("borrowings_2021"); np21=sd.get("np_2021")
    raw=yd.get("raw_2021"); eps_sc=sd.get("eps_2021")
    a21=yd.get("adj_2021")
    ipo = t=="PAYTM"
    roe = round(np21/equity*100,1) if (np21 is not None and equity>0) else None
    de  = None if t in BANKS else (round(borrow/equity,2) if (borrow is not None and equity>0) else None)
    dy  = round(yd["ttm_div_2021"]/raw*100,2) if (yd.get("ttm_div_2021") is not None and raw) else None
    pe  = round(raw/eps_sc,1) if (eps_sc and eps_sc>0 and raw) else None
    cat = "Mid" if t in MID else "Small" if t in SMALL else "Large"
    prom = sd.get("promoter_2021")
    if t=="ITC": prom=0.0
    if t=="PAYTM": prom=None
    cfo_neg=[f"FY{y}" for y in range(2015,2022) if (fy(t,y,"cfo") is not None and fy(t,y,"cfo")<0)]
    out[t]={
      "name":NAMES[t],"sector":SECTOR[t],
      "price": None if ipo else a21,
      "ipoMonth": "2021-11" if ipo else None,
      "effectiveEntry": a21,
      "negNetWorth": neg,
      "marketCap": round(yd["mcap_cr_2021"]) if yd.get("mcap_cr_2021") is not None else None,
      "marketCapCategory": cat,
      "pe": pe,
      "dividendYield": dy,
      "roe": None if neg else roe,
      "debtToEquity": None if neg else de,
      "promoterHolding": prom,
      "promoterHoldingAsOf": None if (t=="PAYTM" or prom is None) else "2021",
      "gpm": None,
      "opm": sd.get("opm_2021"),
      "eps": eps_sc,
      "revenueGrowth3yr": cagr(fy(t,2018,"revenue"),fy(t,2021,"revenue"),3),
      "revenueGrowth5yr": cagr(fy(t,2016,"revenue"),fy(t,2021,"revenue"),5),
      "profitGrowth3yr": cagr(fy(t,2018,"netProfit"),fy(t,2021,"netProfit"),3),
      "profitGrowth5yr": cagr(fy(t,2016,"netProfit"),fy(t,2021,"netProfit"),5),
      "epsConsistencyNote": eps_note(t),
      "cfoNegativeYears": cfo_neg,
    }
    print(f"{t:11} {cat:5} mcap={out[t]['marketCap']} pe={pe} roe={roe} de={de} dy={dy} prom={prom} neg={neg}")

json.dump(out,open("data/snapshot-2021.json","w"),indent=1)
print("WROTE data/snapshot-2021.json", len(out))
