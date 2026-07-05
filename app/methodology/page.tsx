import Link from "next/link";
import { PROJECT } from "@/lib/stats";

export const metadata = {
  title: "Methodology",
  description:
    "How the data was built, how portfolios are scored, and the design decisions behind the MarketMind simulator.",
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 py-10">
      <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-slate-300">
        {children}
      </div>
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-cyan-200">
      {children}
    </pre>
  );
}

export default function Methodology() {
  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      <header className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-slate-950">
            ₹
          </span>
          {PROJECT.name}
        </Link>
        <nav className="ml-auto flex gap-1 text-sm text-slate-300">
          <Link href="/screener" className="rounded-md px-3 py-1.5 hover:bg-white/5">
            Screener
          </Link>
          <a href={PROJECT.github} target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-1.5 hover:bg-white/5">
            GitHub
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">
        <div className="py-8">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            Back to home
          </Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Methodology
          </h1>
          <p className="mt-3 text-slate-400">
            How the data was built, how a portfolio gets scored, and why I made
            the calls I did. The thread running through all of it is
            reproducibility: re-run the pipeline and you should get the same
            numbers this app shows.
          </p>
        </div>

        <Section id="static" title="Why static JSON instead of a database">
          <p>
            The dataset is frozen. The simulation window (June 2021 to June 2026)
            and the June-2021 fundamentals are never going to change, so there&apos;s
            nothing for a live database or third-party API to do at runtime
            except add latency, an API key to manage, and a way for results to
            quietly drift.
          </p>
          <p>
            So the Python pipeline fetches and verifies everything once, then
            writes plain JSON (<code className="text-cyan-200">prices.json</code>,{" "}
            <code className="text-cyan-200">financials.json</code>,{" "}
            <code className="text-cyan-200">snapshot-2021.json</code>,{" "}
            <code className="text-cyan-200">nifty.json</code>). Next.js statically
            generates all 50 stock pages from those files. It&apos;s fast, costs
            nothing to host, and anyone can reproduce it.
          </p>
        </Section>

        <Section id="corporate-actions" title="Corporate actions, and why auto_adjust=True matters">
          <p>
            Prices were pulled with yfinance using{" "}
            <code className="text-cyan-200">auto_adjust=True</code>, which
            back-adjusts old prices for stock splits and bonus issues. Skip it and
            a 1:1 bonus or a 5:1 split looks like a 50 to 80% overnight crash,
            which then poisons every return you calculate.
          </p>
          <p>
            Splits are the easy case. Demergers aren&apos;t, and auto-adjust doesn&apos;t
            touch them. When Tata Motors split into its passenger- and
            commercial-vehicle businesses in 2025, the surviving ticker fell by
            the value of the part that left. I reconstructed that by adding the
            demerged entity&apos;s value back, so the figure reflects what someone who
            held since June 2021 actually ended up with. Market caps use the real
            June-2021 price times the shares outstanding back then, with the split
            factor applied, not today&apos;s share count.
          </p>
        </Section>

        <Section id="fundamentals" title="Fundamentals and the teaching universe">
          <p>
            FY2015 to FY2021 financials and the June-2021 ratios came from
            screener.in, scraped politely (a 2-second gap between requests, with
            everything cached to disk) and then cross-checked. Ten metrics are
            stored per stock: ROE, Debt/Equity, Dividend Yield, Operating Margin
            (a stand-in for gross margin, which screener doesn&apos;t expose), Revenue
            and Net-Profit 3-year CAGR, EPS, CFO, P/E, and Promoter Holding.
          </p>
          <p>
            The universe is a deliberately mixed set of 50 NSE names - roughly 40
            solid businesses and 10 weaker ones - spread across market caps and
            sectors. There is no blocklist or hidden &quot;good stocks&quot; flag: every
            stock is scored purely on its own June-2021 numbers (see the scoring
            section below), so a weak pick loses marks because its fundamentals
            are weak, not because it was tagged. For a bank or NBFC, negative
            operating cash flow is normal when the loan book is growing, so the
            scoring treats a bank&apos;s non-meaningful Debt-Equity as neutral rather
            than a warning sign.
          </p>
        </Section>

        <Section id="scoring" title="The dual scoring system">
          <p>
            A submitted portfolio is scored out of 10 as an even split between how
            it performed and how good the picks were for that investor:
          </p>
          <Formula>{`Final = 0.5 x Performance  +  0.5 x Fundamentals`}</Formula>
          <p>
            <strong>Performance (0-10)</strong> measures the participant&apos;s total
            return against the Nifty 50 (+{PROJECT.niftyReturn}% over the window),
            both indexed to 100 at June 2021:
          </p>
          <Formula>{`relative = participant_return / nifty_return
score   = 1 + 6 x min(relative, 1.5)   (rounded, capped 1-10)
matching the Nifty  -> ~7      beating it by 50%+ -> 10
half the Nifty      -> ~4      a losing portfolio -> 0`}</Formula>
          <p>
            The index is the benchmark everyone knows, so it&apos;s the honest thing to
            grade against: matching it is a solid ~7, adding real value over it
            gets you to 10, and trailing it pulls you down. The Nifty line is drawn
            right on the results chart so you can see exactly where you sat
            relative to it.
          </p>
          <p>
            <strong>Fundamentals (0-10)</strong> is where the scenario comes in.
            Every stock gets five 0-1 sub-scores from its June-2021 numbers, and
            each scenario weights them differently before averaging across your
            holdings:
          </p>
          <Formula>{`Growth     high ROE + revenue/profit CAGR (a compounder)
Value      low P/E  (penalises overpaying)
Income     dividend yield
Stability  low leverage + large-cap size + positive cash flow
Quality    cash flow + promoter holding + earnings consistency

Fundamentals = 10 x sum( weight[scenario][k] x subscore[k] )`}</Formula>
          <p>
            The weights are what make a pick &quot;right&quot; or &quot;wrong&quot; for a person. A
            Fresh Graduate leans hard on growth and quality and barely cares about
            valuation, so a high-ROE, high-P/E compounder scores well. Hand the
            exact same stock to an Elderly Retired couple - where income,
            stability and valuation carry most of the weight - and that rich P/E
            and missing dividend drag it down. Same company, same numbers,
            different verdict, because the two investors need different things.
          </p>
          <p>
            Note that there&apos;s no blocklist: a weak stock simply earns low
            sub-scores, and an expensive-but-good business can still score fine on
            fundamentals while getting punished on the performance half when its
            return trails the index - which is exactly the lesson that good
            fundamentals and a good outcome are not the same thing.
          </p>
          <p>
            The 50/50 weighting is deliberate. Score on returns alone and a lucky
            punt wins; score on fundamentals alone and you reward a good-looking
            balance sheet even if the bet went nowhere. Splitting them is how you
            teach that a good process and a good result are two different things,
            and that the best portfolios manage both.
          </p>
        </Section>

        <Section id="limitations" title="What it doesn't do">
          <ul className="list-disc space-y-2 pl-5 text-slate-300">
            <li>
              Returns are price returns, not total returns. Dividends show up as a
              fundamental metric but aren&apos;t reinvested into the performance number.
            </li>
            <li>
              The universe is a hand-picked 50 stocks (40 solid names plus 10
              deliberate weak ones), so it&apos;s a teaching set, not an index.
            </li>
            <li>
              Holdings are whole shares on a monthly price grid, which makes the
              backtest a close approximation rather than a tick-by-tick model.
            </li>
            <li>
              The scenario weights are a reasoned teaching model of each risk
              profile, not a proven mathematical optimum.
            </li>
          </ul>
        </Section>

        <div className="border-t border-white/10 pt-8 text-sm text-slate-500">
          Machine-readable project stats live at{" "}
          <Link href="/api/stats" className="text-cyan-300 hover:text-cyan-200">
            /api/stats
          </Link>
          .
        </div>
      </main>
    </div>
  );
}
