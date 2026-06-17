# NSE Time Capsule — June 2021

A two-part **financial-literacy teaching tool** for an Indian-stocks (NSE) classroom exercise, built as a single Next.js app.

- **Part 1 — `/screener` (public):** a screener.in-style company page for each of **40 NSE stocks, frozen at June 2021**. Snapshot ratios, year-by-year financials, a Jan 2000 – June 2021 price chart, and peer comparison. Participants get a genuine "track record" view and **see nothing beyond June 2021** before they pick.
- **Part 2 — `/simulator` (host only, password-protected):** pick a life scenario, enter a team's 5-stock portfolio, and reveal **indexed performance over June 2021 → June 2026** with a Nifty 50 overlay, a 1–10 rating, and a per-holding breakdown.

> **Everything uses a FIXED, reproducible window — Jan 2000 to June 2026 — anchored to a fixed June-2026 reference date.** Nothing is "live"/"today"; results never change with the calendar. Prices are split/bonus-adjusted so the screener entry price and the simulator returns stay internally consistent.

---

## Local setup

```bash
npm install
cp .env.example .env.local      # then set SIMULATOR_PASSWORD
npm run dev                     # http://localhost:3000
```

- `/` — landing page
- `/screener` — public screener (all 40 stocks + per-stock detail)
- `/simulator` — host-only; unlock with `SIMULATOR_PASSWORD`

Production build: `npm run build && npm start`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SIMULATOR_PASSWORD` | Shared password gating `/simulator`. Set in `.env.local` locally and in Vercel project settings for production. |

## Routes

| Route | Access | What it shows |
| --- | --- | --- |
| `/screener` | Public | Filterable grid of 40 stocks (sector / market-cap / search) |
| `/screener/[ticker]` | Public | Header chips, Jan 2000–June 2021 price chart, P&L (FY2015–21) with CAGR rows + EPS-consistency note, cash-flow table, peer comparison |
| `/simulator` | Password | Scenario selector, 5-slot portfolio entry with live budget, indexed performance chart + Nifty overlay, 1–10 rating, holdings breakdown |
| `/api/simulator/login`, `/api/simulator/logout` | — | Cookie session for the gate |

## Data layer (`/data`, static JSON)

| File | Contents |
| --- | --- |
| `prices.json` | `id → [{date:"YYYY-MM", close}]` — monthly closes, Jan 2000 – June 2026, split/bonus-adjusted |
| `nifty.json` | Nifty 50 (`^NSEI`) monthly closes (Yahoo history begins 2007; the simulator only needs 2021+) |
| `financials.json` | `id → {FY2015..FY2021 → {revenue, netProfit, eps, cfo}}` |
| `snapshot-2021.json` | `id → {price, marketCap(+category), pe, divYield, roe, de, promoterHolding, opm, …}` for June 2021 |
| `missing-data-report.md` | Per-field coverage / gaps, for manual review |

### Re-running the data-fetch scripts

The data is committed, so the app runs without re-fetching. To regenerate it:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install yfinance requests beautifulsoup4 lxml

cd scripts
python fetch_prices.py        # prices.json + nifty.json  (yfinance)
python fetch_financials.py    # screener.in -> data/screener_raw.json (+ caches HTML to scripts/cache/)
python build_snapshot.py      # financials.json + snapshot-2021.json + missing-data-report.md
```

`scripts/stocks.py` is the single source of truth for the 40 tickers (mirrored in `lib/stocks.ts`). The scraper respects rate limits (1.5 s delays) and caches each response so re-runs don't re-fetch.

## Data coverage (honest notes)

- **Universe:** 40 NSE stocks — 34 fundamentally strong + **6 deliberate weak/"trap" picks** (IDEA, ZEEL, YESBANK, TATASTEEL, COALINDIA, IOC). The UI **never** labels which is which (same cards, same layout) — students must read the FA data to spot the weak ones. The simulator (host-only) stores a model "ideal 5" per scenario, drawn only from the strong names.
- **Prices:** 100% real for all 40 stocks + Nifty (yfinance), monthly. Some series begin at the real listing date (POLYCAB 2019, GRINDWELL 2006, PAGEIND 2007). FINOLEXIND uses Yahoo/screener symbol **FINPIPE** (Finolex Industries).
- **Annual financials FY2015–FY2021:** real (screener.in), full 7-year table. **ABB India** reports on a December fiscal year, so its "FY2021" column = calendar 2021.
- **June-2021 snapshot ratios:** real — derived from FY2021 screener financials + the real split/bonus-adjusted June-2021 close (P/E, market cap, dividend yield, ROE, D/E). FY2021 loss-makers (IDEA, YESBANK, Bharti Airtel) correctly show no P/E but still get a market cap (computed as price × shares); banks show no meaningful D/E. **Vodafone Idea (IDEA)** has **negative net worth** in FY2021, so D/E shows "N/A (negative equity)" and ROE is blank — itself a red flag.
- **Market-cap bands (June 2021):** Large ≥ ₹20,000 Cr (Blue), Mid ₹5,000–20,000 Cr (Purple), Small ₹500–5,000 Cr (Orange), Micro < ₹500 Cr (Red). Result: 36 Large, 3 Mid, 1 Small.
- **Promoter holding:** screener's free shareholding table only reaches ~FY2023, so the earliest available figure is shown as a labelled proxy (ZEEL's low promoter holding is genuine).
- **Gross margin:** not exposed by screener; **OPM% (operating margin)** is shown as the available margin metric.

See `data/missing-data-report.md` for the per-stock breakdown.

## Deploy to Vercel

1. Push to GitHub (done).
2. Import the repo at [vercel.com/new](https://vercel.com/new) — it auto-detects Next.js, no special config.
3. Add **`SIMULATOR_PASSWORD`** under **Settings → Environment Variables**.
4. Deploy. `/screener` is public; `/simulator` requires the password.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · recharts · static JSON data · cookie-based password gate. No database.
