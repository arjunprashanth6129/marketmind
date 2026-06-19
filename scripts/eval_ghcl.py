"""Evaluate the 5 candidate replacements for GHCL (stock #34) and pick the best.

Criteria: GPM/margins, ROE>20, D/E<0.5, positive CFO, consistent EPS growth
FY2015-2021, high promoter holding, simple business, clean price continuity,
and June-2021->June-2026 return ideally above Nifty 50.
"""
import json, time, sys
import yfinance as yf
import requests
from bs4 import BeautifulSoup
from fetch_financials import parse_section, row_get, num, HEADERS

CANDS = [
    ("GARFIBRES", "GARFIBRES.NS", "Garware Technical Fibres"),
    ("FINEORG",   "FINEORG.NS",   "Fine Organic Industries"),
    ("ELGIEQUIP", "ELGIEQUIP.NS", "Elgi Equipments"),
    ("AAVAS",     "AAVAS.NS",     "Aavas Financiers"),
    ("WONDERLA",  "WONDERLA.NS",  "Wonderla Holidays"),
]
A, E = "2021-06", "2026-06"
NIFTY_RET = None


def monthly(yahoo):
    df = yf.download(yahoo, start="2000-01-01", end="2026-06-30", interval="1mo",
                     progress=False, auto_adjust=False, threads=False)
    if df is None or df.empty:
        return []
    cl = df["Close"]
    cl = cl.iloc[:, 0] if hasattr(cl, "columns") else cl
    return [(d.strftime("%Y-%m"), round(float(v), 2)) for d, v in cl.items() if v == v]


def screener(slug):
    for suf in ("consolidated/", ""):
        try:
            r = requests.get(f"https://www.screener.in/company/{slug}/{suf}",
                             headers=HEADERS, timeout=25)
            if r.status_code == 200 and "profit-loss" in r.text:
                return BeautifulSoup(r.text, "lxml")
            time.sleep(2)
        except Exception as e:
            print(f"   screener err {slug}: {e}", file=sys.stderr)
            time.sleep(2)
    return None


def series(soup, sec, *names):
    yrs, rows = parse_section(soup, sec)
    r = row_get(rows, *names)
    if r is None:
        return {}
    return {y: v for y, v in zip(yrs, r) if v is not None}


nf = monthly("^NSEI")
n0 = dict(nf).get(A); n1 = dict(nf).get(E)
NIFTY_RET = (n1 / n0 - 1) * 100
print(f"Nifty 50 June21->June26: {NIFTY_RET:+.1f}%\n")

results = []
for cid, yahoo, name in CANDS:
    print(f"=== {cid} ({name}) ===")
    px = dict(monthly(yahoo))
    first = min(px) if px else None
    p21, p26 = px.get(A), px.get(E)
    ret = (p26 / p21 - 1) * 100 if (p21 and p26) else None
    win = [d for d in px if A <= d <= E]
    soup = screener(cid)
    time.sleep(2)
    rec = {"id": cid, "name": name, "first": first, "p21": p21, "p26": p26,
           "ret": ret, "win_months": len(win)}
    if soup:
        sales = series(soup, "profit-loss", "Sales", "Revenue")
        npr = series(soup, "profit-loss", "Net Profit", "Profit after tax")
        eps = series(soup, "profit-loss", "EPS in Rs", "EPS")
        opm = series(soup, "profit-loss", "OPM %", "OPM")
        cfo = series(soup, "cash-flow", "Cash from Operating Activity", "Cash from Operating")
        borrow = series(soup, "balance-sheet", "Borrowings")
        eqcap = series(soup, "balance-sheet", "Equity Capital", "Share Capital")
        reserves = series(soup, "balance-sheet", "Reserves")
        prom = series(soup, "shareholding", "Promoters")
        eq21 = (eqcap.get("2021", 0) + reserves.get("2021", 0)) if ("2021" in eqcap and "2021" in reserves) else None
        roe = (npr.get("2021") / eq21 * 100) if (npr.get("2021") and eq21 and eq21 > 0) else None
        de = (borrow.get("2021") / eq21) if (borrow.get("2021") is not None and eq21 and eq21 > 0) else None
        # EPS consistency FY2015-2021
        ey = [eps.get(str(y)) for y in range(2015, 2022)]
        decl = sum(1 for i in range(1, len(ey)) if ey[i] is not None and ey[i-1] is not None and ey[i] < ey[i-1])
        eps_have = sum(1 for v in ey if v is not None)
        cfo_neg = [y for y in range(2015, 2022) if cfo.get(str(y)) is not None and cfo.get(str(y)) < 0]
        prom21 = prom.get("2021") or (prom.get(sorted(prom)[0]) if prom else None)
        rec.update({"np21": npr.get("2021"), "eps21": eps.get("2021"), "opm21": opm.get("2021"),
                    "roe": roe, "de": de, "cfo21": cfo.get("2021"), "cfo_neg": cfo_neg,
                    "eps_have": eps_have, "eps_decl": decl, "prom": prom21,
                    "pl_years": sorted(sales.keys()) if sales else []})
    results.append(rec)
    print(f"   listed {first}  win_months={len(win)}  ret={ret if ret is None else round(ret,1)}%")
    print(f"   {json.dumps({k: rec.get(k) for k in ['np21','eps21','opm21','roe','de','cfo21','cfo_neg','eps_have','eps_decl','prom']}, default=str)}\n")

print("\n=== SUMMARY (criteria: ROE>20, D/E<0.5, +CFO, EPS consistent, high promoter, ret>Nifty) ===")
print(f"{'id':11}{'ret%':>8}{'ROE':>7}{'D/E':>7}{'CFO21':>8}{'cfoNeg':>7}{'EPSyrs':>7}{'EPSdecl':>8}{'prom':>7}{'listed':>9}")
for r in results:
    print(f"{r['id']:11}{(r['ret'] and round(r['ret'],1)) or 'NA':>8}{(r.get('roe') and round(r['roe'],1)) or 'NA':>7}"
          f"{(r.get('de') is not None and round(r['de'],2)) if r.get('de') is not None else 'NA':>7}"
          f"{r.get('cfo21','NA'):>8}{len(r.get('cfo_neg',[])):>7}{r.get('eps_have','NA'):>7}{r.get('eps_decl','NA'):>8}"
          f"{(r.get('prom') and round(r['prom'],1)) or 'NA':>7}{str(r['first']):>9}")
json.dump(results, open("ghcl_eval.json", "w"), indent=1, default=str)
print("\nsaved scripts/ghcl_eval.json")
