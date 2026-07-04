#!/usr/bin/env python3
"""Generate the stock-universe reference document from the verified data."""
import json
s=json.load(open("data/snapshot-2021.json"))
# The 10 deliberately weak "trap" picks - listed separately in the universe doc.
# (Scoring no longer blocklists them; they simply score low on their own merits.)
WEAK=["RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND","ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"]

d=["# Stock Universe - All 50 Companies","",
   '40 "good fundamentals" candidates + 10 deliberate weak picks. NSE tickers, as of June 2021.',"",
   "## The 40 'Good fundamentals' list","",
   "| # | Ticker | Company Name | Sector | Market-cap (Jun 2021) |",
   "|---|---|---|---|---|"]
i=0
for t in [x for x in s if x not in WEAK]:
    i+=1; sn=s[t]; d.append(f"| {i} | {t} | {sn['name']} | {sn['sector']} | {sn['marketCapCategory']} |")
d+=["","## The 10 'Weak picks' list (deliberate traps)","",
    "| # | Ticker | Company Name | Sector | Market-cap (Jun 2021) |",
    "|---|---|---|---|---|"]
i=0
for t in [x for x in s if x in WEAK]:
    i+=1; sn=s[t]; d.append(f"| {i} | {t} | {sn['name']} | {sn['sector']} | {sn['marketCapCategory']} |")
d+=["",f"**Total: {len([t for t in s if t not in WEAK])} good + {len(WEAK)} weak = {len(s)} stocks.** "
    "Benchmark: ^NSEI (Nifty 50).",""]
open("data/stock-universe-list.md","w").write("\n".join(d))
print("WROTE data/stock-universe-list.md")
print("stocks listed:",len(s))
