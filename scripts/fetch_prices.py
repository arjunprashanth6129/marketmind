"""Fetch monthly closing prices (Jan 2000 - June 2026) for all 35 stocks + Nifty 50.

Writes data/prices.json  ->  { id: [ {date:"YYYY-MM", close: float}, ... ] }
       data/nifty.json   ->  [ {date:"YYYY-MM", close: float}, ... ]

Prices are split-adjusted but NOT dividend-adjusted (yfinance auto_adjust=False),
so the series reads as the recognisable "stock price" and stays internally
consistent across the whole window -> the screener entry price and the simulator
returns use the same basis. Run from the project root with the venv active:

    python scripts/fetch_prices.py
"""
import json, time, os, sys
import yfinance as yf
from stocks import STOCKS, NIFTY, START, END

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
os.makedirs(DATA, exist_ok=True)


def fetch_monthly(yahoo):
    """Return list of {date:'YYYY-MM', close: float} monthly closes, or [] on failure."""
    for attempt in range(3):
        try:
            df = yf.download(yahoo, start=START, end=END, interval="1mo",
                             progress=False, auto_adjust=False, threads=False)
            if df is None or df.empty:
                return []
            close = df["Close"]
            # yfinance returns a single-column DataFrame for one ticker; squeeze it
            if hasattr(close, "columns"):
                close = close.iloc[:, 0]
            out = []
            for ts, val in close.items():
                if val != val:  # NaN
                    continue
                out.append({"date": ts.strftime("%Y-%m-01"), "close": round(float(val), 2)})
            return out
        except Exception as e:
            print(f"    attempt {attempt+1} failed: {e}", file=sys.stderr)
            time.sleep(3)
    return []


def main():
    prices = {}
    coverage = []
    for i, (sid, yahoo, name, sector) in enumerate(STOCKS, 1):
        print(f"[{i}/{len(STOCKS)}] {sid} ({yahoo}) ...", flush=True)
        series = fetch_monthly(yahoo)
        prices[sid] = series
        first = series[0]["date"] if series else "NONE"
        last = series[-1]["date"] if series else "NONE"
        coverage.append((sid, len(series), first, last))
        print(f"      {len(series)} months  {first} -> {last}", flush=True)
        # incremental save so a mid-run failure doesn't lose progress
        with open(os.path.join(DATA, "prices.json"), "w") as f:
            json.dump(prices, f, separators=(",", ":"))
        time.sleep(1.2)

    print(f"\nNifty 50 ({NIFTY[1]}) ...", flush=True)
    nifty = fetch_monthly(NIFTY[1])
    with open(os.path.join(DATA, "nifty.json"), "w") as f:
        json.dump(nifty, f, separators=(",", ":"))
    print(f"      {len(nifty)} months  "
          f"{nifty[0]['date'] if nifty else 'NONE'} -> {nifty[-1]['date'] if nifty else 'NONE'}")

    print("\n=== COVERAGE ===")
    for sid, n, first, last in coverage:
        flag = "  <-- starts after 2000-01" if first not in ("2000-01", "NONE") else ""
        if n == 0:
            flag = "  <-- NO DATA"
        print(f"{sid:12} {n:4} months  {first} -> {last}{flag}")


if __name__ == "__main__":
    main()
