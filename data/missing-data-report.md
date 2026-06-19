# Missing Data Report

Fixed window: prices Jan 2000 - June 2026 (monthly, `YYYY-MM-01`). Anchor = **June 2021**; financials FY2015-FY2021. All values reproducible against the fixed June-2026 reference date.

## GHCL replacement (stock #34)

GHCL was replaced by **FINEORG (Fine Organic Industries)** after evaluating all 5 candidates on the FA checklist + June2021->June2026 return:

| Candidate | Return | ROE | D/E | +CFO | EPS yrs | Promoter | Note |
|---|---:|---:|---:|:--:|:--:|---:|---|
| GARWARE TF (GARFIBRES) | +2.7% | 19.5% | 0.13 | yes | 7/7 | 52.7% | cleanest data but badly lagged Nifty (+53%) |
| **FINEORG (chosen)** | **+72.4%** | 16.4% | 0.12 | yes | 6/7 | 75.0% | strong FA **and** beats Nifty; listed Jul-2018 (FY2015-17 null) |
| ELGIEQUIP | +190% | 11.7% | 0.53 | yes | 7/7 | 31.2% | great return but ROE/D/E/promoter all miss |
| AAVAS | -46.5% | 12.0% | n/a | no (-CFO x4) | 4/7 | 39.1% | NBFC; fails CFO + return |
| WONDERLA | +128% | n/a | n/a | - | 0 | 69.7% | FY2021 COVID loss; fails entry fundamentals |

**FINEORG** is the only candidate that satisfies both *strong June-2021 fundamentals* (D/E 0.12, +CFO Rs134cr, 75% promoter, simple oleochemicals business, no corporate actions) *and* a return above the Nifty (+72.4% vs +53.2%). Its only gap: listed July 2018, so FY2015-FY2017 are null. (GARFIBRES — the top preference — has cleaner full history but +2.7% return makes it a poor example of a 'good pick that rewarded'.)

## Coverage summary

- **Prices:** 40/40 stocks + Nifty 50 real (yfinance), monthly Jan2000-June2026. Every stock has the June-2021 and June-2026 anchors. Some start at listing (POLYCAB 2019, FINEORG/AAVAS-class 2018, GRINDWELL 2006).
- **June-2021 snapshot ratios:** P/E 37/40, ROE 39/40, D/E 34/40. Derived from real FY2021 screener financials + real split/bonus-adjusted June-2021 close.
- **Annual financials FY2015-FY2021:** real (screener.in). FINEORG missing FY2015-FY2017 (pre-IPO). ABB India reports a December fiscal year (its FY2021 column = calendar 2021). FINOLEXIND uses screener/Yahoo symbol FINPIPE (Finolex Industries).
- **IDEA (Vodafone Idea):** negative net worth FY2021 -> ROE and D/E recorded as N/A.
- **GPM (gross profit margin):** NOT exposed by screener's summary P&L for any stock -> `gpm` is null for all 40; OPM% (operating margin) is captured instead as `opm`.
- **Promoter holding:** screener's free shareholding table reaches ~FY2023, so the earliest available figure is shown as a labelled proxy (ZEEL's low promoter holding is real).

**Null counts:** financials ~9 null cells (mostly FINEORG pre-2018 + gpm); snapshot 110 null fields (gpm x40 + loss-maker P/E + IDEA ROE/DE). No value is estimated or fabricated — gaps are null.

## Per-field gaps

- **all** (2): FINEORG, FINOLEXIND
- **cfo** (1): FINEORG
- **gpm** (40): ABB, ASIANPAINT, BAJAJAUTO, BAJFINANCE, BHARTIARTL, BRITANNIA, CIPLA, COALINDIA, CONCOR, DIVISLAB, DRREDDY, FINEORG, FINOLEXIND, GRINDWELL, HCLTECH, HDFCBANK, HINDUNILVR, ICICIBANK, IDEA, INFY, IOC, ITC, KOTAKBANK, LT, MARICO, MARUTI, NESTLEIND, NTPC, PAGEIND, POLYCAB, POWERGRID, SUNPHARMA, SUPREMEIND, TATASTEEL, TCS, TITAN, TORNTPHARM, VSTIND, YESBANK, ZEEL
- **pe** (2): BHARTIARTL, YESBANK
- **promoterHolding** (40): ABB, ASIANPAINT, BAJAJAUTO, BAJFINANCE, BHARTIARTL, BRITANNIA, CIPLA, COALINDIA, CONCOR, DIVISLAB, DRREDDY, FINEORG, FINOLEXIND, GRINDWELL, HCLTECH, HDFCBANK, HINDUNILVR, ICICIBANK, IDEA, INFY, IOC, ITC, KOTAKBANK, LT, MARICO, MARUTI, NESTLEIND, NTPC, PAGEIND, POLYCAB, POWERGRID, SUNPHARMA, SUPREMEIND, TATASTEEL, TCS, TITAN, TORNTPHARM, VSTIND, YESBANK, ZEEL
- **roe/debtToEquity** (1): IDEA
