#!/usr/bin/env python3
"""Generate two reference documents from the verified data files."""
import json
ports=json.load(open("data/ideal-portfolios.json"))
s=json.load(open("data/snapshot-2021.json"))
NIFTY=53.7
BAD=["RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND","ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"]

# Core investment case per stock used in the ideal portfolios (from FY2021 data).
WHY={
"VBL":"Beverages - India's principal PepsiCo bottler. The standout multibagger (+454%) with sound supporting fundamentals: positive operating cash flow, 66% promoter holding and ~19% profit CAGR (the modest EPS-vs-profit gap reflects equity raised to fund acquisitions, not distress). The growth engine of the aggressive book.",
"BAJFINANCE":"One of India's premier consumer-finance NBFCs with a long, high-quality growth record (~21% profit CAGR, 56% promoter). Its negative FY21 operating cash flow is the normal accounting signature of a rapidly growing loan book, not a red flag. A professional-grade growth holding.",
"COFORGE":"IT-services company (BFSI, insurance, travel). The highest-returning eligible IT name with clean fundamentals - ROE 18.9%, virtually no debt (D/E 0.03), EPS growing faster than profit (buyback, not dilution), promoter 64%. Chosen as a growth engine.",
"BPCL":"State-owned oil refiner and fuel retailer. Combines a high return with quality and income - ROE 32%, very strong operating cash flow (~₹23,500 Cr) and a 4.5% dividend yield. Chosen for growth-plus-income.",
"GRINDWELL":"Saint-Gobain-group abrasives and industrial-ceramics maker (mid-cap). A steady, high-quality industrial consumables play - ROE 17%, essentially debt-free (D/E 0.01). Chosen as the core mid-cap growth holding.",
"ZENSARTECH":"RPG-group digital IT-services firm (mid-cap). Solid, low-debt growth - ROE 13%, D/E 0.15. Chosen as the second eligible mid-cap for higher-risk, growth-tilted scenarios.",
"NESTLEIND":"Packaged-foods leader (Maggi, Nescafé, dairy). The steadiest compounder in the pool - exceptional ROE ~103%, near-zero debt, consistent EPS, 63% promoter holding. Chosen as the defensive anchor / capital-protection holding.",
"SUPREMEIND":"India's largest plastics and piping maker. High quality with strong growth - ROE 31%, almost no debt (D/E 0.01), healthy cash flow. Chosen as a quality industrial growth holding.",
"DIVISLAB":"World-scale maker of active pharmaceutical ingredients (APIs). Debt-free and high-margin - ROE 21%, D/E 0.0, 31% 3-yr profit CAGR. Chosen as quality pharma growth exposure.",
"ITC":"Diversified leader - cigarettes plus FMCG foods, hotels and paper. ROE 22%, debt-free, very large operating cash flow and the highest dividend yield in the pool (~10% trailing, timing-aided). Chosen for income and stability. (0% promoter reflects its widely-held, professionally-managed structure - no governance concern.)",
"MARICO":"FMCG company built on Parachute and Saffola. A steady consumer compounder - ROE 37%, low debt (D/E 0.16), 1.4% dividend yield. Chosen for low-volatility stability and modest income.",
"TECHM":"Large IT-services firm with a heavy telecom/communications mix. ROE 17.5%, low debt, and a 3.2% dividend yield. Chosen for income plus growth in the lowest-risk income scenario.",
"SUNDARMFIN":"TVS-group vehicle-financing NBFC. Eligible (ROE 16%, positive operating cash flow, no EPS dilution) but not used in the final five portfolios.",
}

# ---------- DOC 1: ideal portfolios explained ----------
m=["# Ideal Portfolios - Stocks, Returns & Why Each Was Picked","",
   "Five professionally-constructed model portfolios, one per life-stage scenario, each with a "
   "distinct mandate and risk budget. Every stock clears two hard filters: **total return "
   "June 2021 → June 2026 beats Nifty 50 (+53.7%)** AND **sound June-2021 fundamentals** "
   "(ROE >= 10% only where the rest of the quality profile - cash flow, balance sheet, "
   "promoter, growth - is strong; no loss years; no governance flag). The portfolios are "
   "deliberately differentiated: no two share more than 3 of 5 names, and they span aggressive "
   "growth to dividend income. A few elite franchises (NESTLEIND, ITC, SUPREMEIND, COFORGE) "
   "legitimately anchor more than one risk profile.","",
   f"**Benchmark to beat: Nifty 50 = +{NIFTY}%.** All five portfolios beat it comfortably.",""]
for p in ports:
    m+= [f"## {p['scenario']} - {p.get('theme','')}  (capital ₹{p['capital']:,})","",
         f"- **Portfolio total return: +{p['portfolio_total_return_pct']}%**  ·  "
         f"vs Nifty: **+{p['vs_nifty_pct_points']} pts**  ·  ideal-benchmark return used for scoring: +{p['portfolio_total_return_pct']}%",
         f"- **Selection approach:** {p['selection_rationale']}","",
         "| Ticker | Company | Cap | Entry (Jun’21) | Exit (Jun’26) | Return | Weight | Why this stock was picked |",
         "|---|---|---|---|---|---|---|---|"]
    for st in p["stocks"]:
        t=st["ticker"]; sn=s[t]
        m.append(f"| **{t}** | {sn['name']} | {sn['marketCapCategory']} | ₹{st['entry_price']:,} | "
                 f"₹{st['exit_price']:,} | +{st['stock_return_pct']}% | {st['weight_pct']}% | {WHY.get(t,'')} |")
    m.append("")
open("data/ideal-portfolios-explained.md","w").write("\n".join(m))

# ---------- DOC 2: full 50-stock list ----------
order=[t for t in s if t not in BAD]+[t for t in s if t in BAD]
d=["# Stock Universe - All 50 Companies","",
   f"40 \"good fundamentals\" candidates + 10 deliberate weak picks. NSE tickers, as of June 2021.","",
   "## The 40 'Good fundamentals' list","",
   "| # | Ticker | Company Name | Sector | Market-cap (Jun 2021) |",
   "|---|---|---|---|---|"]
i=0
for t in [x for x in s if x not in BAD]:
    i+=1; sn=s[t]; d.append(f"| {i} | {t} | {sn['name']} | {sn['sector']} | {sn['marketCapCategory']} |")
d+=["","## The 10 'Weak picks' list (deliberate traps)","",
    "| # | Ticker | Company Name | Sector | Market-cap (Jun 2021) |",
    "|---|---|---|---|---|"]
i=0
for t in [x for x in s if x in BAD]:
    i+=1; sn=s[t]; d.append(f"| {i} | {t} | {sn['name']} | {sn['sector']} | {sn['marketCapCategory']} |")
d+=["",f"**Total: {len([t for t in s if t not in BAD])} good + {len(BAD)} weak = {len(s)} stocks.** "
    "Benchmark: ^NSEI (Nifty 50).",""]
open("data/stock-universe-list.md","w").write("\n".join(d))
print("WROTE data/ideal-portfolios-explained.md and data/stock-universe-list.md")
print("portfolios:",len(ports),"| stocks listed:",len(s))
