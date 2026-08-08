import Link from "next/link";
import { PROJECT, STATS } from "@/lib/stats";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import Reveal from "./components/Reveal";
import CountUp from "./components/CountUp";
import HeroPanel from "./components/HeroPanel";
import CardFlip from "./components/CardFlip";
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
    title: "100-stock NSE universe",
    subtitle: "The market, frozen at June 2021.",
    description:
      "A hundred real NSE companies, half of them small caps in 2021, with nothing from the future leaking in.",
    features: [
      "Half were small caps in 2021",
      "FY2015-FY2021 financials",
      "Ten fundamental metrics",
      "Line and candlestick views",
    ],
    href: "/screener",
    ctaLabel: "Open the screener",
  },
  {
    Icon: IconClock,
    title: "Prices that survive the rewind",
    subtitle: "A 5:1 split is not an 80% crash.",
    description:
      "A rewind only works if every price is adjusted for what happened since. Each one here was recomputed, not copied.",
    features: [
      "Split- and bonus-adjusted",
      "Tata Motors demerger rebuilt",
      "Corrupt vendor closes repaired",
      "Like-for-like entry vs exit",
    ],
    href: "/methodology#corporate-actions",
    ctaLabel: "See the adjustments",
  },
  {
    Icon: IconScale,
    title: "Dual scoring system",
    subtitle: "Good process and good outcome, scored apart.",
    description:
      "Half the mark is realised return, half is the quality of the picks.",
    features: [
      "50% performance vs Nifty 50",
      "50% fundamental quality",
      "Scenario-weighted rubric",
      "No hidden good-stock list",
    ],
    href: "/methodology#scoring",
    ctaLabel: "Read the rubric",
  },
  {
    Icon: IconUsers,
    title: "Five investor scenarios",
    subtitle: "The same stock, judged differently.",
    description:
      "Each profile needs something different, so each weights the metrics its own way.",
    features: [
      "Fresh graduate to retiree",
      "Own capital budget",
      "Own risk appetite",
      "Drawn at random when you play",
    ],
    href: "/play",
    ctaLabel: "Draw an investor",
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
      "100 companies × 7 years of financials",
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
      "100 pre-rendered stock pages",
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
                  MarketMind freezes the Indian market at June 2021. Study 100
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

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 70} className="h-full">
                <CardFlip
                  title={f.title}
                  subtitle={f.subtitle}
                  description={f.description}
                  features={f.features}
                  icon={<f.Icon className="h-5 w-5" />}
                  href={f.href}
                  ctaLabel={f.ctaLabel}
                />
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

        {/* ---------- Play the game ---------- */}
        <section className="relative overflow-hidden border-t border-line">
          <div aria-hidden className="grid-bg absolute inset-0" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(42rem 24rem at 50% 120%, rgba(77,141,255,0.16), transparent 65%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-5 py-24 text-center">
            <Reveal>
              <p className="eyebrow">Try it yourself</p>
              <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-fg sm:text-4xl">
                Four steps. One real outcome.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-fg-muted">
                Get handed an investor at random, research the June-2021 market
                on their behalf, then build a portfolio and find out how it
                actually did.
              </p>

              <ol className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["01", "Get your investor", "Drawn at random"],
                  ["02", "Research the market", "100 companies, June 2021"],
                  ["03", "Build the portfolio", "Inside a capital budget"],
                  ["04", "Score it", "Backtested to June 2026"],
                ].map(([n, title, sub]) => (
                  <li
                    key={n}
                    className="rounded-xl border border-line bg-ink-900/70 p-4 text-left backdrop-blur"
                  >
                    <span className="tnum text-[11px] font-medium text-accent">
                      {n}
                    </span>
                    <p className="mt-1.5 text-[14px] font-semibold text-fg">
                      {title}
                    </p>
                    <p className="mt-0.5 text-[12px] text-fg-dim">{sub}</p>
                  </li>
                ))}
              </ol>

              <Link
                href="/play"
                className="group mt-10 inline-flex items-center gap-2.5 rounded-xl bg-accent px-7 py-4 text-[15px] font-semibold text-ink-950 shadow-lg shadow-accent/20 transition-colors duration-200 hover:bg-[#6ba0ff]"
              >
                Invest in the Market
                <IconArrowRight className="h-[18px] w-[18px] transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <p className="mt-4 text-xs text-fg-dim">
                Takes about ten minutes · no sign-up
              </p>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
