import Link from "next/link";
import Header from "./components/Header";
import { STOCKS } from "@/lib/stocks";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="mb-10">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Fixed window · Jan 2000 – June 2026 · reproducible
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            A financial-literacy time capsule of {STOCKS.length} NSE stocks
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Step back to <strong>June 2021</strong>, study {STOCKS.length} of
            India&apos;s biggest companies as they looked then, build a portfolio
            for a real-life scenario, and fast-forward five years to June 2026
            to see how it played out — all on a fixed, reproducible dataset.
          </p>
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          <Link
            href="/screener"
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-brand)]">
              Part 1 · Public
            </div>
            <h2 className="text-xl font-bold text-gray-900">Screener Clone</h2>
            <p className="mt-2 text-sm text-gray-600">
              A screener.in-style company page for each stock, frozen at June
              2021: snapshot ratios, year-by-year financials, a Jan 2000–June
              2021 price chart, and peer comparison. Nothing beyond June 2021 —
              participants get a genuine &ldquo;track record&rdquo; view before
              they pick.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-[var(--color-brand)] group-hover:underline">
              Browse all {STOCKS.length} stocks →
            </span>
          </Link>

          <Link
            href="/simulator"
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
          >
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Part 2 · Host only 🔒
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Portfolio Simulator
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Password-protected host tool. Pick a life scenario, enter a
              team&apos;s 5-stock portfolio, and reveal indexed performance over
              June 2021–June 2026 with a Nifty 50 overlay, a 1–10 rating, and a
              per-holding breakdown.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-gray-700 group-hover:underline">
              Enter the simulator →
            </span>
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          All prices are split/bonus-adjusted and the entire dataset is pinned to
          a fixed June-2026 reference date, so results never change with the
          calendar. See the data coverage notes in the project README.
        </p>
      </main>
    </>
  );
}
