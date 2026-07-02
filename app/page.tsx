import Link from "next/link";
import { PROJECT, STATS } from "@/lib/stats";
import Reveal from "./components/Reveal";
import CountUp from "./components/CountUp";

export const metadata = {
  title: `${PROJECT.name} - ${PROJECT.tagline}`,
};

/* ---------------- small presentational helpers ---------------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-indigo-400/40 hover:bg-white/[0.05]">
      <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-400/20 text-xl ring-1 ring-inset ring-white/10">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}

/* A lightweight, pure-CSS/SVG "product preview" - looks like the live app. */
function AppMockup() {
  // three indexed performance lines (participant / ideal / nifty)
  const pts = (seed: number, end: number) => {
    const a: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const noise = Math.sin(i * 1.3 + seed) * 4;
      a.push(100 + (end - 100) * t + noise);
    }
    return a;
  };
  const series = [
    { d: pts(1, 176), stroke: "#818cf8", w: 2.4, dash: "" }, // participant
    { d: pts(3, 150), stroke: "#fbbf24", w: 1.8, dash: "5 4" }, // ideal
    { d: pts(5, 134), stroke: "#94a3b8", w: 1.4, dash: "1 4" }, // nifty
  ];
  const all = series.flatMap((s) => s.d);
  const min = Math.min(...all),
    max = Math.max(...all);
  const path = (arr: number[]) =>
    arr
      .map((v, i) => {
        const x = (i / 24) * 300;
        const y = 120 - ((v - min) / (max - min)) * 110 - 5;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-2 shadow-2xl shadow-indigo-950/40 backdrop-blur">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 rounded bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
          marketmind.vercel.app/simulator
        </span>
      </div>
      <div className="rounded-xl bg-slate-950/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-300">
            Indexed performance · 100 = June 2021
          </span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            Score 8.0 / 10
          </span>
        </div>
        <svg viewBox="0 0 300 120" className="h-36 w-full">
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              x2="300"
              y1={10 + i * 33}
              y2={10 + i * 33}
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}
          {series.map((s, i) => (
            <path
              key={i}
              d={path(s.d)}
              fill="none"
              stroke={s.stroke}
              strokeWidth={s.w}
              strokeDasharray={s.dash}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 rounded bg-indigo-400" /> Your portfolio
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 rounded bg-amber-400" /> Ideal
          </span>
          <span className="flex items-center gap-1">
            <span className="h-0.5 w-4 rounded bg-slate-400" /> Nifty 50
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1e] text-slate-200">
      {/* ambient background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 70% -10%, rgba(99,102,241,0.18), transparent 60%), radial-gradient(50rem 30rem at 10% 10%, rgba(34,211,238,0.10), transparent 55%)",
        }}
      />
      <div className="relative z-10">
        {/* Nav */}
        <header className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-slate-950">
              ₹
            </span>
            {PROJECT.name}
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm text-slate-300">
            <Link href="/screener" className="rounded-md px-3 py-1.5 hover:bg-white/5">
              Screener
            </Link>
            <Link href="/methodology" className="rounded-md px-3 py-1.5 hover:bg-white/5">
              Methodology
            </Link>
            <Link href="/simulator" className="rounded-md px-3 py-1.5 hover:bg-white/5">
              Simulator <span className="text-[10px] text-slate-500">🔒</span>
            </Link>
            <a
              href={PROJECT.github}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 rounded-md border border-white/10 px-3 py-1.5 hover:bg-white/5"
            >
              GitHub
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <Reveal>
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Verified June 2021 → June 2026 · reproducible dataset
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {PROJECT.name}
                <span className="block bg-gradient-to-r from-indigo-300 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  {PROJECT.tagline}
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
                {PROJECT.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/screener"
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-indigo-900/40 transition hover:brightness-110"
                >
                  Open Stock Screener →
                </Link>
                <a
                  href={PROJECT.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View on GitHub
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <Badge>Next.js · App Router</Badge>
                <Badge>TypeScript</Badge>
                <Badge>Python data pipeline</Badge>
                <Badge>Vercel</Badge>
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <AppMockup />
          </Reveal>
        </section>

        {/* Stats row */}
        <section className="mx-auto max-w-6xl px-5 py-8">
          <Reveal>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3 lg:grid-cols-6">
              {STATS.map((s) => (
                <div key={s.label} className="bg-[#0a0f1e] p-5 text-center">
                  <div className="text-3xl font-extrabold text-white">
                    <CountUp value={s.value} suffix={s.suffix} prefix={s.prefix} />
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* What it does */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <Reveal>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              What it does
            </h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              A two-part product: a research-grade screener to study companies,
              and a host-run simulator that backtests and scores the portfolios
              participants build from them.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "📊",
                title: "50-Stock NSE Universe",
                body: "Verified price history from Jan 2000, FY2015-FY2021 annual financials, and 10 fundamental metrics for every stock.",
              },
              {
                icon: "⏱️",
                title: "Real Backtesting Engine",
                body: "June 2021 → June 2026 on split/bonus-adjusted prices, indexed to 100, with a Nifty 50 benchmark overlay.",
              },
              {
                icon: "🎯",
                title: "Dual Scoring System",
                body: "50% portfolio performance vs a scenario-specific ideal portfolio, 50% fundamental-analysis quality score.",
              },
              {
                icon: "🧭",
                title: "5 Investor Scenarios",
                body: "Risk-matched ideal portfolios from Fresh Graduate to Retired Couple - each verified to beat the Nifty 50.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 90}>
                <FeatureCard {...f} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* Architecture */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <Reveal>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Technical architecture
            </h2>
            <p className="mt-2 max-w-2xl text-slate-400">
              A Python data pipeline feeds a pre-computed static JSON layer that a
              Next.js front end renders and scores - no runtime database, fully
              reproducible.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 grid items-stretch gap-3 lg:grid-cols-4">
              {[
                {
                  k: "Data Pipeline",
                  sub: "Python",
                  items: ["yfinance (auto-adjusted OHLCV)", "screener.in scraper + cache", "50 × 7yr financials"],
                },
                {
                  k: "Static Data Layer",
                  sub: "JSON",
                  items: ["prices · financials", "snapshot-2021 ratios", "ideal-portfolios · nifty"],
                },
                {
                  k: "Frontend",
                  sub: "Next.js + TS",
                  items: ["App Router, SSG", "Tailwind CSS, Recharts", "50 static stock pages"],
                },
                {
                  k: "Scoring + Deploy",
                  sub: "TS / Vercel",
                  items: ["dual-component engine", "server-only ideal data", "Vercel edge + SSG"],
                },
              ].map((c, i) => (
                <div key={c.k} className="relative">
                  <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-cyan-300/80">
                      {c.sub}
                    </div>
                    <div className="mt-0.5 font-semibold text-white">{c.k}</div>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
                      {c.items.map((it) => (
                        <li key={it} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-indigo-400" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i < 3 && (
                    <span className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-slate-600 lg:block">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Methodology / rigor */}
        <section className="mx-auto max-w-6xl px-5 py-14">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/[0.08] to-cyan-400/[0.05] p-8 sm:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    Verified, not assumed
                  </h2>
                  <p className="mt-3 max-w-2xl text-slate-300">
                    Every stock&apos;s return was independently recomputed from
                    split/bonus-adjusted yfinance data - never copied from a
                    third-party report. Fundamentals were scraped from
                    screener.in (FY2015-FY2021), corporate actions like the Tata
                    Motors demerger were handled explicitly, and the whole
                    dataset is pinned to a fixed June-2026 reference date so
                    results never drift.
                  </p>
                  <Link
                    href="/methodology"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Read the full methodology →
                  </Link>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Nifty 50 benchmark
                  </div>
                  <div className="mt-1 text-5xl font-extrabold text-emerald-400">
                    <CountUp value={PROJECT.niftyReturn} suffix="%" decimals={1} prefix="+" />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Jun 2021 → Jun 2026 · the benchmark to beat
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-4">
              <a href={PROJECT.github} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                GitHub
              </a>
              <Link href="/methodology" className="hover:text-white">
                Methodology
              </Link>
              <span className="text-slate-600">Next.js · TypeScript · Python · Vercel</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
