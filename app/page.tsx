import Link from "next/link";
import { PROJECT, STATS } from "@/lib/stats";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import Reveal from "./components/Reveal";
import CountUp from "./components/CountUp";
import HeroPanel from "./components/HeroPanel";
import {
  IconArrowRight,
  IconCandles,
  IconClock,
  IconDatabase,
  IconLayers,
  IconScale,
  IconShield,
  IconTerminal,
  IconUsers,
} from "./components/Icons";

export const metadata = {
  title: `${PROJECT.name} - ${PROJECT.tagline}`,
};

/* ---------------- section chrome ---------------- */

function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-fg sm:text-3xl">
        {title}
      </h2>
      {children && (
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
          {children}
        </p>
      )}
    </div>
  );
}

const FEATURES = [
  {
    Icon: IconCandles,
    title: "50-stock NSE universe",
    body: "Verified price history from 2000, FY2015-FY2021 annual financials, and ten fundamental metrics for every company.",
  },
  {
    Icon: IconClock,
    title: "Real backtesting engine",
    body: "June 2021 to June 2026 on split- and bonus-adjusted prices, indexed to 100, with a Nifty 50 benchmark overlay.",
  },
  {
    Icon: IconScale,
    title: "Dual scoring system",
    body: "Half the mark is realised performance against the Nifty 50; half is scenario-weighted fundamental quality.",
  },
  {
    Icon: IconUsers,
    title: "Five investor scenarios",
    body: "Fresh graduate through retired couple. Each profile weights the fundamentals differently, so the same stock scores to fit.",
  },
];

const ARCHITECTURE = [
  {
    Icon: IconTerminal,
    stage: "01",
    kicker: "Python",
    title: "Data pipeline",
    items: [
      "yfinance, auto-adjusted OHLCV",
      "screener.in scraper with disk cache",
      "50 companies × 7 years of financials",
    ],
  },
  {
    Icon: IconDatabase,
    stage: "02",
    kicker: "JSON",
    title: "Static data layer",
    items: [
      "prices · financials",
      "June-2021 ratio snapshot",
      "Nifty 50 benchmark series",
    ],
  },
  {
    Icon: IconLayers,
    stage: "03",
    kicker: "Next.js · TS",
    title: "Frontend",
    items: [
      "App Router, fully static",
      "Tailwind CSS, Recharts",
      "50 pre-rendered stock pages",
    ],
  },
  {
    Icon: IconScale,
    stage: "04",
    kicker: "TypeScript",
    title: "Scoring & deploy",
    items: [
      "Dual-component engine",
      "Scenario-weighted rubric",
      "Vercel edge, static output",
    ],
  },
];

/* ---------------- page ---------------- */

export default function Landing() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/* ---------- Hero ---------- */}
        <section className="relative overflow-hidden border-b border-line">
          <div aria-hidden className="grid-bg absolute inset-0" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(48rem 28rem at 78% -8%, rgba(77,141,255,0.13), transparent 62%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
            <Reveal>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-ink-850 py-1 pl-1.5 pr-3">
                  <span className="rounded-full bg-pos/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-pos">
                    Verified
                  </span>
                  <span className="text-xs text-fg-muted">
                    June 2021 → June 2026 · reproducible dataset
                  </span>
                </div>

                <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.12] tracking-tight text-fg sm:text-[3.25rem]">
                  <span className="block">Learn to invest on</span>
                  <span className="block">the market that</span>
                  {/* The rule sits under the last line rather than behind it,
                      so tight leading can never overlap the line above. */}
                  <span className="relative inline-block">
                    actually happened.
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-accent"
                    />
                  </span>
                </h1>

                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-fg-muted">
                  MarketMind freezes the Indian market at June 2021. Study 50
                  real NSE companies as they looked then, build a portfolio for
                  an assigned investor, and see exactly how it would have
                  performed over the five years that followed.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link
                    href="/screener"
                    className="group inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-ink-950 transition-colors duration-200 hover:bg-[#6ba0ff]"
                  >
                    Open the screener
                    <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/methodology"
                    className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-3 text-sm font-semibold text-fg transition-colors duration-200 hover:border-fg-dim hover:bg-ink-850"
                  >
                    Read the methodology
                  </Link>
                </div>

                <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-6">
                  {[
                    ["Built with", "Next.js · TypeScript"],
                    ["Pipeline", "Python"],
                    ["Deploy", "Vercel"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[11px] uppercase tracking-wider text-fg-dim">
                        {k}
                      </dt>
                      <dd className="mt-0.5 text-sm font-medium text-fg-muted">
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <HeroPanel />
            </Reveal>
          </div>
        </section>

        {/* ---------- Stats strip ---------- */}
        <section className="border-b border-line bg-ink-850/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-line px-5 sm:grid-cols-3 lg:grid-cols-6 lg:divide-y-0">
            {STATS.map((s) => (
              <div key={s.label} className="px-4 py-7 text-center">
                <div className="tnum text-[28px] font-semibold text-fg">
                  <CountUp value={s.value} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div className="mt-1.5 text-[11px] leading-tight text-fg-dim">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- What it does ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <SectionHead eyebrow="What it does" title="Two halves of one lesson">
              A research-grade screener for studying companies, and a host-run
              simulator that backtests and scores the portfolios built from
              them.
            </SectionHead>
          </Reveal>

          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
            {FEATURES.map(({ Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="group h-full bg-ink-900 p-7 transition-colors duration-200 hover:bg-ink-850">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-line-strong bg-ink-850 text-accent transition-colors duration-200 group-hover:border-accent/50">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-[15px] font-semibold text-fg">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                    {body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------- Architecture ---------- */}
        <section className="border-y border-line bg-ink-850/40">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <Reveal>
              <SectionHead
                eyebrow="Architecture"
                title="A pipeline, not a database call"
              >
                Python fetches and verifies the data once, writes it to static
                JSON, and Next.js pre-renders every page from those files. No
                runtime database, no API keys, no drift.
              </SectionHead>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ARCHITECTURE.map(({ Icon, stage, kicker, title, items }, i) => (
                <Reveal key={title} delay={i * 70}>
                  <div className="h-full rounded-xl border border-line bg-ink-900 p-5">
                    <div className="flex items-center justify-between">
                      <span className="grid h-9 w-9 place-items-center rounded-lg border border-line-strong bg-ink-850 text-accent">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="tnum text-xs text-fg-dim">{stage}</span>
                    </div>
                    <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-accent">
                      {kicker}
                    </p>
                    <h3 className="mt-1 text-[15px] font-semibold text-fg">
                      {title}
                    </h3>
                    <ul className="mt-3 space-y-2 border-t border-line pt-3 text-[13px] leading-relaxed text-fg-muted">
                      {items.map((it) => (
                        <li key={it} className="flex gap-2.5">
                          <span
                            aria-hidden
                            className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-fg-dim"
                          />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Rigor ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <div className="grid items-center gap-10 rounded-xl border border-line bg-ink-850/60 p-8 sm:p-10 lg:grid-cols-[1.35fr_0.65fr]">
              <div>
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-line-strong bg-ink-800 text-accent">
                  <IconShield className="h-5 w-5" />
                </span>
                <h2 className="mt-5 text-[26px] font-semibold tracking-tight text-fg sm:text-3xl">
                  Verified, not assumed
                </h2>
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-fg-muted">
                  Every return was independently recomputed from split- and
                  bonus-adjusted data rather than copied from a third-party
                  report. Fundamentals were scraped from screener.in for FY2015
                  to FY2021, corporate actions like the Tata Motors demerger
                  were reconstructed by hand, and the whole dataset is pinned to
                  a fixed reference date so the numbers never drift.
                </p>
                <Link
                  href="/methodology"
                  className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors duration-200 hover:text-[#7db0ff]"
                >
                  Read the full methodology
                  <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </div>

              <div className="rounded-lg border border-line bg-ink-900 p-6 text-center">
                <p className="eyebrow">Nifty 50 benchmark</p>
                <div className="tnum mt-3 text-[44px] font-semibold leading-none text-pos">
                  <CountUp
                    value={PROJECT.niftyReturn}
                    suffix="%"
                    decimals={1}
                    prefix="+"
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-fg-dim">
                  June 2021 → June 2026
                  <br />
                  the benchmark to beat
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
