# Missing Data Report

Fixed window: prices Jan 2000-June 2026 (monthly). Anchor = **June 2021**; financials FY2015-FY2021. All values reproducible against the fixed June-2026 reference date.

## Coverage summary

- **Universe:** 40 NSE stocks (34 fundamentally strong + 6 deliberate weak/"trap" picks: IDEA, ZEEL, YESBANK, TATASTEEL, COALINDIA, IOC). The UI never labels which is which — students must read the FA data.
- **Prices (monthly, Jan 2000-June 2026):** 40/40 stocks + Nifty 50 real (yfinance). Every stock has the June-2021 and June-2026 anchor months. Some series start at their real listing date (POLYCAB 2019, GRINDWELL 2006, PAGEIND 2007).
- **Annual financials FY2015-FY2021:** real (screener.in P&L + cash flow), full 7-year table. ABB India reports on a **December** fiscal year, so its "FY2021" column = calendar 2021. FINOLEXIND uses screener slug FINPIPE (Finolex Industries).
- **June-2021 snapshot ratios:** P/E for 37/40, ROE for 39/40, D/E for 34/40. Derived from real FY2021 financials + the real split/bonus-adjusted June-2021 close. Banks (HDFCBANK, ICICIBANK, KOTAKBANK, YESBANK) have no meaningful D/E.
- **Vodafone Idea (IDEA):** negative net worth in FY2021 (accumulated losses exceed equity) and a net loss, so P/E is blank and D/E shows "N/A (negative equity)" — itself a red flag students should catch.
- **Promoter holding:** screener's free shareholding table only reaches ~FY2023, so the earliest available figure is shown as a labelled proxy (ZEEL's low promoter holding is genuine).
- **Gross Profit Margin:** not exposed by screener; OPM% (operating margin) shown instead.

## Per-field gaps

- **FY2015** (1): no annual data for this year  
  _FINOLEXIND_
- **grossMargin** (40): not exposed by screener; OPM% shown instead  
  _TCS, INFY, HCLTECH, HDFCBANK, ICICIBANK, KOTAKBANK, YESBANK, BAJFINANCE, HINDUNILVR, ITC, NESTLEIND, BRITANNIA, MARICO, VSTIND, TITAN, ASIANPAINT, PAGEIND, SUNPHARMA, CIPLA, DRREDDY, DIVISLAB, TORNTPHARM, MARUTI, BAJAJAUTO, LT, ABB, GRINDWELL, POLYCAB, SUPREMEIND, FINOLEXIND, GHCL, CONCOR, POWERGRID, NTPC, BHARTIARTL, IDEA, ZEEL, TATASTEEL, COALINDIA, IOC_
- **pe** (2): loss-making or missing FY2021 EPS — no meaningful P/E  
  _YESBANK, BHARTIARTL_
- **promoterHolding** (40): June-2021 unavailable; earliest screener value (FY2023)  
  _TCS, INFY, HCLTECH, HDFCBANK, ICICIBANK, KOTAKBANK, YESBANK, BAJFINANCE, HINDUNILVR, ITC, NESTLEIND, BRITANNIA, MARICO, VSTIND, TITAN, ASIANPAINT, PAGEIND, SUNPHARMA, CIPLA, DRREDDY, DIVISLAB, TORNTPHARM, MARUTI, BAJAJAUTO, LT, ABB, GRINDWELL, POLYCAB, SUPREMEIND, FINOLEXIND, GHCL, CONCOR, POWERGRID, NTPC, BHARTIARTL, IDEA, ZEEL, TATASTEEL, COALINDIA, IOC_
- **roe/de** (1): negative net worth (FY2021) — ROE/D/E not meaningful  
  _IDEA_
