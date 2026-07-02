#!/usr/bin/env python3
"""Correct Jun-2021 market cap = split_adjusted_2021_price * split_factor(after Jun30 2021) * shares_2021.
yfinance 'Close' (auto_adjust=False) is split-adjusted to current basis, so reconstruct true raw price."""
import json
import pandas as pd, yfinance as yf

d=json.load(open("data/yf.json"))
A=pd.Timestamp("2021-06-30")
for t,r in d.items():
    if t=="^NSEI": continue
    if r.get("status","").startswith("NOT LISTED"):
        r["raw_2021"]=None; r["adj_2021"]=None; r["mcap_cr_2021"]=None
        r["mcap_note"]="not listed by Jun 2021 (IPO later) - no Jun-2021 market cap"
        continue
    sp=yf.Ticker(t+".NS").splits
    fac=1.0
    if sp is not None and not sp.empty:
        spv=sp[sp.index.tz_localize(None)>A]
        for x,v in spv.items(): fac*=float(v)
    r["split_factor_after_jun2021"]=round(fac,4)
    if r.get("raw_2021") and r.get("shares_2021"):
        r["mcap_cr_2021"]=round(r["raw_2021"]*fac*r["shares_2021"]/1e7,0)
    print(f"{t:12} fac={fac:<5g} raw21={r.get('raw_2021')} shares_cr={ (r.get('shares_2021') or 0)/1e7:.2f} -> mcap={r.get('mcap_cr_2021')}")

json.dump(d,open("data/yf.json","w"),indent=2)
print("PATCHED data/yf.json")
