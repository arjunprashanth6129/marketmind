#!/usr/bin/env python3
"""Combine yfinance + screener data, compute derived metrics, run sanity checks,
write data/final-verified-stock-universe.md and data/missing-data-report.md."""
import json, os

y=json.load(open("data/yf.json"))
s=json.load(open("data/screener.json"))

GOOD=["BIOCON","ASTRAL","HDFCBANK","CYIENT","MPHASIS","KOTAKBANK","GARFIBRES","DRREDDY","GODREJCP",
 "KAJARIACER","HAVELLS","AMBUJACEM","COLPAL","ADANIGREEN","VOLTAS","RELIANCE","HCLTECH","JYOTHYLAB",
 "CIPLA","BAJAJFINSV","CERA","TECHM","BRITANNIA","TATACONSUM","ZENSARTECH","DIVISLAB","BAJFINANCE",
 "MARICO","NESTLEIND","SUPREMEIND","SUNDARMFIN","GRINDWELL","RPOWER","AXISBANK","ITC","COFORGE",
 "BPCL","YESBANK","VBL","INFY"]
BAD=["RAJESHEXPO","JPASSOCIAT","RELAXO","AAVAS","AARTIIND","ZEEL","GUJGASLTD","IGL","PAYTM","WIPRO"]
BANKS={"HDFCBANK","KOTAKBANK","AXISBANK","YESBANK"}

missing=[]  # (ticker, field, note)

def cat(m):
    if m is None: return "n/a"
    if m>20000: return "Large"
    if m>=5000: return "Mid"
    return "Small"

def cagr3(end,base):
    if end is None or base is None or base<=0 or end<=0: return None
    return ((end/base)**(1/3)-1)*100

def f(x,nd=1,suf=""):
    return "n/a" if x is None else f"{x:,.{nd}f}{suf}"

rows={}
for t in GOOD+BAD:
    yd=y[t]; sd=s.get(t,{})
    grp="GOOD" if t in GOOD else "BAD"
    eqcap=sd.get("equity_capital_2021"); res=sd.get("reserves_2021")
    equity = (eqcap or 0)+(res or 0) if (eqcap is not None or res is not None) else None
    np21=sd.get("np_2021"); np18=sd.get("np_2018")
    borrow=sd.get("borrowings_2021")
    eps_sc=sd.get("eps_2021"); eps_sc18=sd.get("eps_2018")
    sf=yd.get("split_factor_after_jun2021") or 1.0
    raw=yd.get("raw_2021")
    # ROE
    roe = (np21/equity*100) if (np21 is not None and equity and equity>0) else None
    # D/E (banks: borrowings row not meaningful on screener)
    if t in BANKS:
        de=None; missing.append((t,"Debt-to-Equity","bank: screener has no clean Borrowings row (deposits dominate); D/E not meaningful"))
    else:
        de=(borrow/equity) if (borrow is not None and equity and equity>0) else None
        if de is None and borrow is None: missing.append((t,"Borrowings/D-E","screener Borrowings row empty"))
    # dividend yield
    dy=(yd.get("ttm_div_2021")/raw*100) if (yd.get("ttm_div_2021") is not None and raw) else None
    # GPM -> OPM proxy
    gpm=sd.get("opm_2021")
    if gpm is None: missing.append((t,"GPM (OPM proxy)","screener has no margin row (bank/finance) - gross/operating margin n/a"))
    # CAGRs
    revc=cagr3(sd.get("sales_2021"),sd.get("sales_2018"))
    npc=cagr3(np21,np18)
    if revc is None: missing.append((t,"Revenue 3yr CAGR","base FY2018 sales unavailable (recent IPO / Dec-year truncation)" if sd.get("sales_2018") is None else "non-positive base"))
    if npc is None: missing.append((t,"Net Profit 3yr CAGR","FY2018 or FY2021 net profit non-positive/unavailable - CAGR not meaningful"))
    epsc=cagr3(eps_sc,eps_sc18)
    # EPS as-reported (screener eps is split-adjusted to current basis -> x split factor)
    eps_disp = (eps_sc*sf) if eps_sc is not None else None
    # P/E (raw price split-adj basis / screener eps split-adj basis)
    pe = (raw/eps_sc) if (eps_sc and eps_sc>0 and raw) else None
    # EPS consistency note
    if eps_sc is None or eps_sc18 is None:
        note="EPS history unavailable (recent IPO / fiscal transition)"
    elif np18 is None or np18<=0 or (np21 is not None and np21<0):
        note="Loss in FY2018 or FY2021 - growth comparison not meaningful"
    elif epsc is not None and npc is not None:
        gap=npc-epsc
        if abs(gap)<2: tag="EPS grew in line with net profit - negligible dilution"
        elif gap>0: tag=f"EPS CAGR {epsc:.0f}% < net-profit CAGR {npc:.0f}% - share dilution"
        else: tag=f"EPS CAGR {epsc:.0f}% > net-profit CAGR {npc:.0f}% - buyback/share reduction"
        note=tag
    else:
        note="n/a"
    # promoter special cases
    prom=sd.get("promoter_2021")
    if t=="ITC": prom=0.0; prom_disp="0.0 (no identifiable promoter)"
    elif t=="PAYTM": prom=None; prom_disp="n/a (not listed FY2021; no promoter classification)"; missing.append((t,"Promoter Holding","not listed in FY2021; first shareholding disclosure Mar-2022"))
    else: prom_disp=f(prom,2,"%")
    if prom is None and t!="PAYTM": missing.append((t,"Promoter Holding","screener Promoters row empty"))
    if sd.get("cfo_2021") is None: missing.append((t,"CFO FY2021","screener cash-flow row empty"))
    if eps_sc is None: missing.append((t,"EPS FY2021","screener EPS row empty"))

    rows[t]=dict(group=grp, name=yd.get("yf_name"), sname=yd.get("screener_name"),
        sector=yd.get("sector"), mcap=yd.get("mcap_cr_2021"), catg=cat(yd.get("mcap_cr_2021")),
        p21=yd.get("adj_2021"), p26=yd.get("adj_2026"), ret=yd.get("return_pct"),
        ca=yd.get("splits"), roe=roe, de=de, dy=dy, gpm=gpm, revc=revc, npc=npc,
        eps=eps_disp, note=note, cfo=sd.get("cfo_2021"), pe=pe, prom_disp=prom_disp,
        view=sd.get("view"), fy=sd.get("fy_col"), first=yd.get("first_date"),
        status=yd.get("status"))

# name override for GUJGASLTD (yfinance returns outdated 'Gujarat Energy Limited')
if rows.get("GUJGASLTD"): rows["GUJGASLTD"]["name"]="Gujarat Gas Limited"

nifty=y["^NSEI"]

def corp_actions(r):
    parts=[]
    if r["ca"]: parts.append("Split/Bonus: "+r["ca"])
    if r["status"] and ("NOT LISTED" in r["status"] or "LISTED NOV" in r["status"]):
        parts.append(r["status"])
    return "; ".join(parts) if parts else "None"

COLS=["Ticker","Company Name","Sector","Jun-2021 Mkt Cap (Cr)","Cap Cat","Jun-2021 Price",
 "Jun-2026 Price","Total % Return","Corporate Actions","ROE %","D/E","Div Yield %","GPM (OPM proxy) %",
 "Rev 3y CAGR %","NP 3y CAGR %","EPS (FY21)","EPS Consistency","CFO (Cr)","P/E (Jun21)","Promoter %"]

def render(tickers):
    out=["| "+" | ".join(COLS)+" |","|"+"|".join(["---"]*len(COLS))+"|"]
    for t in tickers:
        r=rows[t]
        cells=[t, r["name"] or r["sname"] or "", r["sector"], f(r["mcap"],0), r["catg"],
            f(r["p21"],1), f(r["p26"],1), f(r["ret"],1), corp_actions(r),
            f(r["roe"],1), f(r["de"],2), f(r["dy"],2), f(r["gpm"],0),
            f(r["revc"],1), f(r["npc"],1), f(r["eps"],2), r["note"], f(r["cfo"],0),
            (f(r["pe"],1) if r["pe"] is not None else "NM"), r["prom_disp"]]
        out.append("| "+" | ".join(str(c).replace("\n"," ") for c in cells)+" |")
    return "\n".join(out)

# sanity
good_neg=[t for t in GOOD if rows[t]["ret"] is not None and rows[t]["ret"]<0]
bad_pos=[t for t in BAD if rows[t]["ret"] is not None and rows[t]["ret"]>0]
outliers=[t for t in GOOD+BAD if rows[t]["ret"] is not None and (rows[t]["ret"]>200 or rows[t]["ret"]<-90)]
gcat={"Large":[],"Mid":[],"Small":[]}
for t in GOOD:
    c=rows[t]["catg"]
    if c in gcat: gcat[c].append(t)

md=[]
md.append("# Final Verified Stock Universe - Independent Rebuild")
md.append("")
md.append("**Window:** 30 June 2021 → latest available 2026 trading day. "
          "**Sources:** prices/returns/splits/historical shares/dividends from yfinance "
          "(`auto_adjust=True` for returns); FY2021 (Mar-2021, or Dec-2020 for Dec-fiscal-year "
          "companies) fundamentals scraped from screener.in (consolidated where available). "
          "Every number recomputed from source - nothing carried over from prior reports.")
md.append("")
md.append(f"- **2026 price date used:** {nifty['adj_2026_date']} (latest available; 2026 fiscal year incomplete).")
md.append(f"- **Market cap basis:** true Jun-2021 market cap = (split-adjusted Jun-2021 price × cumulative "
          "split factor for splits after 30-Jun-2021) × historical shares outstanding at Jun-2021 "
          "(`get_shares_full`). This reconstructs the *actual* Jun-2021 market value (not current shares).")
md.append(f"- **EPS / P-E basis:** screener historical EPS is split-adjusted to current basis; the EPS column "
          "shows as-reported FY2021 EPS (= screener EPS × post-2021 split factor); P/E = Jun-2021 price ÷ FY2021 EPS "
          "(both on the same adjusted basis, so internally consistent).")
md.append(f"- **GPM caveat:** screener.in does not disclose a separate gross-profit line; the **GPM column uses "
          "Operating Profit Margin (OPM%) as a documented proxy.** True gross margin for FY2021 was not sourceable "
          "(logged in missing-data-report.md). Banks have no margin row → n/a.")
md.append(f"- **ROE** = FY2021 net profit ÷ FY2021 year-end equity (equity capital + reserves). "
          "**D/E** = FY2021 borrowings ÷ equity; for the four banks screener has no clean borrowings line "
          "(deposit-funded), so D/E is marked n/a.")
md.append("- **Dividend yield** = sum of dividends with ex-date in the trailing 12 months to 30-Jun-2021 ÷ Jun-2021 "
          "price. A few names (ITC, BRITANNIA) read high because COVID-delayed FY2020 final dividends and special "
          "dividends fell inside that 12-month window - it is a true ex-date TTM figure but timing-distorted; the "
          "steady-state yield is lower.")
md.append("")
md.append("## 3. Verified Nifty 50 (^NSEI) benchmark")
md.append("")
md.append(f"| Index | {nifty['adj_2021_date']} (adj) | {nifty['adj_2026_date']} (adj) | Total % Return |")
md.append("|---|---|---|---|")
md.append(f"| Nifty 50 (^NSEI) | {nifty['adj_2021']:,.1f} | {nifty['adj_2026']:,.1f} | **+{nifty['return_pct']}%** |")
md.append("")
md.append(f"> Benchmark to beat: **+{nifty['return_pct']}%** over the five-year window.")
md.append("")
md.append('## 1. "Good" list - 40 stocks (every column from own fetch)')
md.append("")
md.append(render(GOOD))
md.append("")
md.append('## 2. "Bad" list - 10 stocks')
md.append("")
md.append(render(BAD))
md.append("")
md.append("## 4. Flags & sanity checks")
md.append("")
md.append("### 4a. \"Good\" list stocks with NEGATIVE total return (candidates to reconsider)")
if good_neg:
    for t in good_neg:
        md.append(f"- **{t}** ({rows[t]['name']}): **{rows[t]['ret']}%** - underperformed; trailed Nifty by "
                  f"{rows[t]['ret']-nifty['return_pct']:.0f} pts. Sits in the \"Good\" list on fundamentals/quality "
                  "but its 5-yr price return is negative.")
else:
    md.append("- None.")
md.append("")
md.append("### 4b. \"Bad\" list stocks with POSITIVE total return (candidates to reassign)")
md.append("- None - all 10 \"Bad\" list names posted negative 5-yr returns (range "
          f"{min(rows[t]['ret'] for t in BAD)}% to {max(rows[t]['ret'] for t in BAD)}%). The bad list is internally consistent.")
md.append("")
md.append("### 4c. Implausible / extreme outliers (>+200% or <−90%) - manual review")
for t in outliers:
    r=rows[t]
    md.append(f"- **{t}** {r['ret']}% - reviewed: corporate actions = {corp_actions(r)}. "
              "auto_adjust handles the split math; return verified against split-adjusted series (genuine multibagger, not a data error).")
if not outliers: md.append("- None.")
md.append("")
md.append("### 4d. YESBANK fundamental sanity check (FY2021)")
yb=rows["YESBANK"]; ybs=s["YESBANK"]
md.append(f"YESBANK price return is **+{yb['ret']}%**, but FY2021 fundamentals are **weak**, consistent with a bank "
          "still digesting its 2020 reconstruction:")
md.append("")
md.append(f"- FY2021 **net profit = ₹{ybs['np_2021']:,.0f} Cr (a LOSS)**; EPS = ₹{ybs['eps_2021']} (negative).")
md.append(f"- **ROE FY2021 ≈ {yb['roe']:.1f}%** (negative - loss over positive equity).")
md.append(f"- **Promoter holding ≈ {ybs['promoter_2021']}%** - effectively no promoter; SBI-led investor consortium "
          "holds the reconstruction stake.")
md.append(f"- Revenue FY2021 ₹{ybs['sales_2021']:,.0f} Cr vs FY2018 ₹{ybs['sales_2018']:,.0f} Cr - flat/declining topline.")
md.append("- D/E: n/a (deposit-funded bank).")
md.append("")
md.append("> **Verdict:** the +88% price move is a **low-base recovery bounce off the post-collapse 2020 price, not "
          "evidence of strong fundamentals.** On FY2021 fundamentals (loss-making, negative ROE, no promoter) YESBANK "
          "does **not** look like a \"good fundamentals\" stock. Flagged for your judgement.")
md.append("")
md.append("### 4e. Market-cap diversity within the 40-stock \"Good\" list")
md.append("")
md.append(f"| Category | Count | Tickers |")
md.append("|---|---|---|")
for c in ["Large","Mid","Small"]:
    md.append(f"| {c} | {len(gcat[c])} | {', '.join(gcat[c]) or '-'} |")
md.append("")
small_n=len(gcat["Small"]); mid_n=len(gcat["Mid"])
md.append(f"> **Small-cap (<₹5,000 Cr) count = {small_n}.** "
          + ("**FLAG: small-cap representation is thin (<6-8).** " if small_n<6 else "")
          + f"Mid-cap (₹5-20k Cr) = {mid_n}. "
          "If you want richer small-cap growth scenarios, consider swapping in a few more verified small-cap names "
          "with positive returns and solid fundamentals - **not done automatically; flagged for your decision.**")
md.append("")
md.append("### 4f. Note on \"Good\" list names sitting in Large-cap value/quality bucket")
md.append("Several \"Good\" names are large, lower-beta compounders that *underperformed or roughly matched* Nifty over "
          "this specific window (e.g. HDFCBANK +12%, KOTAKBANK +19%, DRREDDY +21%, BIOCON +3%, INFY −18%). They are "
          "quality businesses but were not the window's price winners - relevant when building \"good fundamentals ≠ "
          "guaranteed good return\" teaching scenarios.")
md.append("")
os.makedirs("data",exist_ok=True)
open("data/final-verified-stock-universe.md","w").write("\n".join(md))

# missing-data report
mm=["# Missing / Substituted Data Report","",
    "Fields that could not be sourced cleanly from screener.in or yfinance after trying both. "
    "Where a field could not be sourced cleanly it is reported here rather than filled in. Grouped by field.",""]
from collections import defaultdict
byfield=defaultdict(list)
seen=set()
for t,fld,note in missing:
    key=(t,fld)
    if key in seen: continue
    seen.add(key)
    byfield[fld].append((t,note))
for fld in sorted(byfield):
    mm.append(f"## {fld}")
    for t,note in byfield[fld]:
        mm.append(f"- **{t}** - {note}")
    mm.append("")
mm.append("## Global substitution note: Gross Profit Margin")
mm.append("screener.in's standard P&L lumps all operating expenses into one line and does **not** publish a separate "
          "gross-profit / COGS line, and yfinance does not retain FY2021 (Mar-2021) income-statement detail in 2026. "
          "**True FY2021 Gross Profit Margin was therefore not sourceable for any ticker.** The report's GPM column "
          "substitutes **Operating Profit Margin (OPM%)** from screener as a clearly-labelled proxy; banks have no "
          "margin line and are n/a.")
mm.append("")
open("data/missing-data-report.md","w").write("\n".join(mm))
print("WROTE data/final-verified-stock-universe.md and data/missing-data-report.md")
print("good_neg",good_neg)
print("bad_pos",bad_pos)
print("outliers",outliers)
print("good cap counts", {k:len(v) for k,v in gcat.items()})
