import Link from "next/link";
import { PROJECT } from "@/lib/stats";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export const metadata = {
  title: "Methodology",
  description:
    "How the data was built, how portfolios are scored, and the design decisions behind the MarketMind simulator.",
};

const SECTIONS = [
  { id: "static", title: "Why static JSON instead of a database" },
  { id: "corporate-actions", title: "Corporate actions and auto-adjust" },
  { id: "fundamentals", title: "Fundamentals and the teaching universe" },
  { id: "scoring", title: "The dual scoring system" },
  { id: "limitations", title: "What it doesn't do" },
] as const;

function Section({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-10">
      <div className="flex items-baseline gap-3">
        <span className="tnum text-[13px] font-medium text-accent">
          {String(index).padStart(2, "0")}
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="mt-4 space-y-4 text-[15px] leading-[1.75] text-fg-muted">
        {children}
      </div>
    </section>
  );
}

/** Code-ish block for formulas. Mono, bordered, horizontally scrollable. */
function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="thin-scroll overflow-x-auto rounded-lg border border-line bg-ink-850 px-4 py-3.5 font-mono text-[13px] leading-relaxed text-fg">
      {children}
    </pre>
  );
}

/** Inline code token. */
function C({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-line bg-ink-850 px-1.5 py-0.5 font-mono text-[13px] text-accent">
      {children}
    </code>
  );
}

export default function Methodology() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <div className="gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_200px]">
          {/* ---- Article ---- */}
          <article className="min-w-0 max-w-2xl">
            <header>
              <p className="eyebrow">Documentation</p>
              <h1 className="mt-2 text-[32px] font-semibold tracking-tight text-fg sm:text-[40px]">
                Methodology
              </h1>
              <p className="mt-4 text-[17px] leading-relaxed text-fg-muted">
                How the data was built, how a portfolio gets scored, and why I
                made the calls I did. The thread running through all of it is
                reproducibility: re-run the pipeline and you should get the same
                numbers this app shows.
              </p>
            </header>

            <Section index={1} id="static" title="Why static JSON instead of a database">
              <p>
                The dataset is frozen. The simulation window (June 2021 to June
                2026) and the June-2021 fundamentals are never going to change,
                so there&apos;s nothing for a live database or third-party API to
                do at runtime except add latency, an API key to manage, and a way
                for results to quietly drift.
              </p>
              <p>
                So the Python pipeline fetches and verifies everything once, then
                writes plain JSON (<C>prices.json</C>, <C>financials.json</C>,{" "}
                <C>snapshot-2021.json</C>, <C>nifty.json</C>). Next.js statically
                generates all 100 stock pages from those files. It&apos;s fast,
                costs nothing to host, and anyone can reproduce it.
              </p>
            </Section>

            <Section
              index={2}
              id="corporate-actions"
              title="Corporate actions, and why auto_adjust matters"
            >
              <p>
                Prices were pulled with yfinance using <C>auto_adjust=True</C>,
                which back-adjusts old prices for stock splits and bonus issues.
                Skip it and a 1:1 bonus or a 5:1 split looks like a 50 to 80%
                overnight crash, which then poisons every return you calculate.
              </p>
              <p>
                Splits are the easy case. Demergers aren&apos;t, and auto-adjust
                doesn&apos;t touch them. When Tata Motors split into its
                passenger- and commercial-vehicle businesses in 2025, the
                surviving ticker fell by the value of the part that left. I
                reconstructed that by adding the demerged entity&apos;s value
                back, so the figure reflects what someone who held since June
                2021 actually ended up with. Market caps use the real June-2021
                price times the shares outstanding back then, with the split
                factor applied, not today&apos;s share count.
              </p>
            </Section>

            <Section
              index={3}
              id="fundamentals"
              title="Fundamentals and the teaching universe"
            >
              <p>
                FY2015 to FY2021 financials and the June-2021 ratios came from
                screener.in, scraped politely (a 2-second gap between requests,
                with everything cached to disk) and then cross-checked. Ten
                metrics are stored per stock: ROE, Debt/Equity, Dividend Yield,
                Operating Margin (a stand-in for gross margin, which screener
                doesn&apos;t expose), Revenue and Net-Profit 3-year CAGR, EPS,
                CFO, P/E, and Promoter Holding.
              </p>
              <p>
                The universe is a deliberately mixed set of 100 NSE names spread
                across market caps and sectors. It started as 50 and was later
                doubled, with the second 50 chosen so that exactly half of them
                were <strong className="font-semibold text-fg">small caps at
                the June-2021 anchor</strong> and the rest large or mid. That
                matters for teaching: small caps are where the widest outcomes
                live, and the added names range from Zen Technologies at roughly
                twenty times its money to Himatsingka Seide down by half.
              </p>
              <p>
                Nothing about the cap label is asserted by hand. It is computed
                from the June-2021 market cap, which is reconstructed as the
                split-adjusted June-2021 close multiplied by today&apos;s share
                count - both quoted on the same per-share basis, so the product
                is the market cap as it stood at the anchor without needing to
                know what the corporate actions in between were. Large is 20,000
                Cr and above, mid 5,000 to 20,000, small below 5,000.
              </p>
              <p>
                There is no blocklist or hidden &quot;good stocks&quot; flag:
                every stock is scored purely on its own June-2021 numbers (see
                the scoring section below), so a weak pick loses marks because
                its fundamentals are weak, not because it was tagged. For a bank
                or NBFC, negative operating cash flow is normal when the loan
                book is growing, so the scoring treats a lender&apos;s
                non-meaningful Debt-Equity as neutral rather than a warning sign.
              </p>
            </Section>

            <Section index={4} id="scoring" title="The dual scoring system">
              <p>
                A submitted portfolio is scored out of 10 as an even split
                between how it performed and how good the picks were for that
                investor:
              </p>
              <Formula>{`Final = 0.5 x Performance  +  0.5 x Fundamentals`}</Formula>
              <p>
                <strong className="font-semibold text-fg">
                  Performance (0-10)
                </strong>{" "}
                measures the participant&apos;s total return against the Nifty 50
                (+{PROJECT.niftyReturn}% over the window), both indexed to 100 at
                June 2021:
              </p>
              <Formula>{`relative = participant_return / nifty_return
score   = 1 + 6 x min(relative, 1.5)   (rounded, capped 1-10)
matching the Nifty  -> ~7      beating it by 50%+ -> 10
half the Nifty      -> ~4      a losing portfolio -> 0`}</Formula>
              <p>
                The index is the benchmark everyone knows, so it&apos;s the
                honest thing to grade against: matching it is a solid ~7, adding
                real value over it gets you to 10, and trailing it pulls you
                down. The Nifty line is drawn right on the results chart so you
                can see exactly where you sat relative to it.
              </p>
              <p>
                <strong className="font-semibold text-fg">
                  Fundamentals (0-10)
                </strong>{" "}
                is where the scenario comes in. Every stock gets five 0-1
                sub-scores from its June-2021 numbers, and each scenario weights
                them differently before averaging across your holdings:
              </p>
              <Formula>{`Growth     high ROE + revenue/profit CAGR (a compounder)
Value      low P/E  (penalises overpaying)
Income     dividend yield
Stability  low leverage + large-cap size + positive cash flow
Quality    cash flow + promoter holding + earnings consistency

Fundamentals = 10 x sum( weight[scenario][k] x subscore[k] )`}</Formula>
              <p>
                The weights are what make a pick &quot;right&quot; or
                &quot;wrong&quot; for a person. A Fresh Graduate leans hard on
                growth and quality and barely cares about valuation, so a
                high-ROE, high-P/E compounder scores well. Hand the exact same
                stock to an Elderly Retired couple - where income, stability and
                valuation carry most of the weight - and that rich P/E and
                missing dividend drag it down. Same company, same numbers,
                different verdict, because the two investors need different
                things.
              </p>
              <p>
                Note that there&apos;s no blocklist: a weak stock simply earns
                low sub-scores, and an expensive-but-good business can still
                score fine on fundamentals while getting punished on the
                performance half when its return trails the index - which is
                exactly the lesson that good fundamentals and a good outcome are
                not the same thing.
              </p>
              <p>
                The 50/50 weighting is deliberate. Score on returns alone and a
                lucky punt wins; score on fundamentals alone and you reward a
                good-looking balance sheet even if the bet went nowhere.
                Splitting them is how you teach that a good process and a good
                result are two different things, and that the best portfolios
                manage both.
              </p>
            </Section>

            <Section index={5} id="limitations" title="What it doesn't do">
              <ul className="space-y-3">
                {[
                  "Returns are price returns, not total returns. Dividends show up as a fundamental metric but aren't reinvested into the performance number.",
                  "The universe is a hand-picked 100 stocks, half of the added 50 being small caps at the anchor, so it's a teaching set with a deliberate small-cap tilt rather than an index.",
                  "Holdings are whole shares on a monthly price grid, which makes the backtest a close approximation rather than a tick-by-tick model.",
                  "The scenario weights are a reasoned teaching model of each risk profile, not a proven mathematical optimum.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-fg-dim"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>

            <div className="border-t border-line pt-8 text-sm text-fg-dim">
              Machine-readable project stats live at{" "}
              <Link
                href="/api/stats"
                className="text-accent transition-colors duration-200 hover:text-[#7db0ff]"
              >
                /api/stats
              </Link>
              .
            </div>
          </article>

          {/* ---- Table of contents ---- */}
          <aside className="hidden lg:block">
            <nav
              aria-label="On this page"
              className="sticky top-24 border-l border-line pl-5"
            >
              <p className="eyebrow">On this page</p>
              <ul className="mt-3 space-y-2.5">
                {SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="group flex gap-2.5 text-[13px] leading-snug text-fg-muted transition-colors duration-200 hover:text-fg"
                    >
                      <span className="tnum text-fg-dim transition-colors duration-200 group-hover:text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
