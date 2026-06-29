# MarketMind - Financial Literacy Simulator

[![Live Demo](https://img.shields.io/badge/Live-Demo-000?logo=vercel)](https://nse-time-capsule.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-data_pipeline-3776ab?logo=python&logoColor=white)](https://www.python.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)](https://vercel.com)

**Live:** https://nse-time-capsule.vercel.app

MarketMind is a stock-market  simulator I built to teach my schoolmates fundamental
analysis the way it actually works: research real companies, build a portfolio
for a real-life situation, then find out how it would have done. As part of a financial literacy programme run by my school, students have to come up with a crucial finance topic that anyone needs to know regardless of their profession, research on it and teach the topic to their classmates. I picked the topic of investing; starting my project with a presentation on investing, I used this simulator as a game for my classmates to make this session a whole lot more interactive. 

## Overview

Most "learn to invest" tools are either a wall of theory or a play-money game
with no stakes. I wanted something in between. MarketMind freezes the Indian
market at June 2021 and lets you study 50 real NSE companies exactly as they
looked then, with no future data leaking in. You then build a 5-stock portfolio
for an assigned investor (a fresh graduate, a young family, a retired couple,
and so on), and the app backtests it against real June 2021 to June 2026 prices.

The hard part was never the interface. It was getting the data right. Over this
five-year window Indian stocks went through splits, bonus issues, and in one
case (Tata Motors) a full demerger. If you pull raw prices, a 5:1 split shows up
as an 80% overnight crash and every return you compute after that is wrong. So
every figure here was recomputed from split- and bonus-adjusted data,
cross-checked, and then frozen into static files so the numbers never drift.

I originally built it for a Financial Literacy Project session, where it ran as
the live "reveal" at the end: each team saw how their picks performed and why.

## What's in it

- **Stock screener** (`/screener`): the 50-company universe as of June 2021.
  Every stock has a ratio snapshot, annual financials from FY2015 to FY2021, a
  long-term price chart, a peer comparison, and a short plain-English write-up.
  Nothing past June 2021 is shown, so you're judging companies on their track
  record rather than on hindsight.
- **Portfolio simulator** (`/simulator`, password-gated for the host): pick a
  scenario, build a portfolio inside a capital budget, and watch it plotted
  against that scenario's ideal portfolio and the Nifty 50, with a score out
  of 10.
- **Scoring**: half the score is how the portfolio actually performed, the other
  half is the quality of the picks. Details below.

## How the data was built

Prices come from yfinance with `auto_adjust=True`, which back-adjusts history
for splits and bonus issues. That one flag is doing a lot of work: without it,
the splits and bonuses in this universe would each read as a sudden crash. Splits
aren't the whole story though. A demerger isn't a split, so yfinance won't fix
it. When Tata Motors split into separate passenger- and commercial-vehicle
companies in 2025, the surviving ticker dropped by the value of the spun-off
business, and I had to add that value back by hand to recover what a
buy-and-hold holder really ended up with.

Fundamentals were scraped from screener.in (FY2015 to FY2021) with a 2-second
delay between requests and on-disk caching so I wasn't hammering the site.
Ten metrics are stored per stock. The Nifty 50 returned **+53.7%** over the
window, and that's the line every portfolio gets measured against.

The whole dataset lives in static JSON rather than a database. Since everything
is pinned to June 2021, the data never changes, so a live database or API would
only add latency, keys to manage, and a way for results to drift. Flat files are
faster, free to host, and reproducible.

## Scoring

```
Final Score (0-10) = 0.5 * Performance + 0.5 * Fundamentals
```

**Performance (0-10)** compares the participant's total return to the ideal
portfolio's return for that scenario, both indexed to 100 at June 2021:

```
relative = participant_return / ideal_return
10 if relative >= 1.0   (capped, you can't beat "perfect")
 9 if 0.90 to 0.99 ... down to 1 if 0 to 0.19
 0 if the portfolio lost money
```

**Fundamentals (0-10)** averages a per-stock rubric over the holdings:

| Metric | Points |
|---|---|
| ROE | >25% = 3, 15-25% = 2, 5-15% = 1, else 0 |
| Debt / Equity | <0.3 = 2, 0.3-1.0 = 1, >1.0 = 0 (banks/NBFCs: 1 if ROE and CFO are healthy) |
| Cash flow from ops | positive = 2, negative = 0 |
| Revenue/profit consistency | both 3yr CAGRs positive and EPS tracks profit = 2, partial = 1, declining = 0 |
| Promoter holding | >50% = 1, 25-50% = 0.5, under 25% / none = 0 |

A "trap" stock (one of the deliberate weak picks) scores 0 on the fundamental
side no matter what the rubric says. The 50/50 split is the whole point: I didn't
want a lucky punt to win, and I didn't want good-looking fundamentals to win if
the bet went nowhere. Splitting them forces you to get both the process and the
outcome right.

## Architecture

```
  Python pipeline            Static JSON              Next.js app             Vercel
 (run once, offline)        (committed)             (TypeScript)
 ------------------         --------------          ----------------         --------
 yfinance prices       -->  prices.json        -->  /  landing            -->  SSG:
 screener.in fund.          financials.json         /screener  (SSG)            50 stock
 corp-action fixes          snapshot-2021.json      /screener/[ticker]          pages +
 eligibility screen         ideal-portfolios.json   /simulator (gated)          edge fns
 portfolio builder          nifty.json              /api/stats
```

The ideal-portfolio file is read only on the server (by the scoring action), so
the "answer key" never reaches the browser.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router), TypeScript | static generation for the 50 stock pages; types across the data layer catch mistakes early |
| Styling | Tailwind CSS | quick to iterate, no component-library weight |
| Charts | Recharts | declarative SVG charts, easy to theme |
| Data | Python (yfinance, BeautifulSoup, pandas) | the obvious toolkit for market data and scraping |
| Storage | static JSON | the data is fixed, so a database buys nothing but complexity |
| Hosting | Vercel | painless Next.js deploys |

## Project impact

This shipped as a live Financial Literacy Project session. Teams used the
screener to research companies, built portfolios for an assigned investor
persona, and I revealed their backtested results and scores live, so the lesson
came from real outcomes instead of slides.

## Running it locally

```bash
git clone https://github.com/arjunprashanth6129/nse-time-capsule
cd nse-time-capsule
npm install
cp .env.example .env.local      # set SIMULATOR_PASSWORD for the host gate
npm run dev                     # http://localhost:3000
```

`SIMULATOR_PASSWORD` is the only env var; it's the shared password that gates the
host-only `/simulator` page.

## Regenerating the data

The Python scripts at the repo root rebuild the static data layer. They need a
virtualenv with `yfinance`, `pandas`, `beautifulsoup4`, `lxml`, and `requests`:

```bash
python yf_fetch.py            # adjusted prices, returns, splits, shares, dividends
python screener_fetch.py      # screener.in FY2015-FY2021 fundamentals (cached)
python build_financials.py    # writes data/financials.json
python build_snapshot.py      # writes data/snapshot-2021.json
python fetch_prices.py        # monthly series -> data/prices.json + nifty.json
python build_portfolios.py    # eligibility screen + the 5 ideal portfolios
```

## License

MIT
