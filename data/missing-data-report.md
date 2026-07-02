# Missing / Substituted Data Report

Fields that could not be sourced cleanly from screener.in or yfinance after trying both. Per spec, these are reported (not fabricated). Grouped by field.

## Debt-to-Equity
- **HDFCBANK** - bank: screener has no clean Borrowings row (deposits dominate); D/E not meaningful
- **KOTAKBANK** - bank: screener has no clean Borrowings row (deposits dominate); D/E not meaningful
- **AXISBANK** - bank: screener has no clean Borrowings row (deposits dominate); D/E not meaningful
- **YESBANK** - bank: screener has no clean Borrowings row (deposits dominate); D/E not meaningful

## GPM (OPM proxy)
- **HDFCBANK** - screener has no margin row (bank/finance) - gross/operating margin n/a
- **KOTAKBANK** - screener has no margin row (bank/finance) - gross/operating margin n/a
- **BAJFINANCE** - screener has no margin row (bank/finance) - gross/operating margin n/a
- **SUNDARMFIN** - screener has no margin row (bank/finance) - gross/operating margin n/a
- **AXISBANK** - screener has no margin row (bank/finance) - gross/operating margin n/a
- **YESBANK** - screener has no margin row (bank/finance) - gross/operating margin n/a
- **AAVAS** - screener has no margin row (bank/finance) - gross/operating margin n/a

## Net Profit 3yr CAGR
- **ADANIGREEN** - FY2018 or FY2021 net profit non-positive/unavailable - CAGR not meaningful
- **YESBANK** - FY2018 or FY2021 net profit non-positive/unavailable - CAGR not meaningful
- **JPASSOCIAT** - FY2018 or FY2021 net profit non-positive/unavailable - CAGR not meaningful
- **PAYTM** - FY2018 or FY2021 net profit non-positive/unavailable - CAGR not meaningful

## Promoter Holding
- **PAYTM** - not listed in FY2021; first shareholding disclosure Mar-2022

## Revenue 3yr CAGR
- **PAYTM** - base FY2018 sales unavailable (recent IPO / Dec-year truncation)

## Global substitution note: Gross Profit Margin
screener.in's standard P&L lumps all operating expenses into one line and does **not** publish a separate gross-profit / COGS line, and yfinance does not retain FY2021 (Mar-2021) income-statement detail in 2026. **True FY2021 Gross Profit Margin was therefore not sourceable for any ticker.** The report's GPM column substitutes **Operating Profit Margin (OPM%)** from screener as a clearly-labelled proxy; banks have no margin line and are n/a.
