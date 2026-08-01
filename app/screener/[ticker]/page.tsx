import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PriceChart from "../PriceChart";
import {
  STOCK_IDS,
  getStockMeta,
  getPeerIds,
  hasNoPeers,
  peerNote,
} from "@/lib/stocks";
import {
  getSnapshot,
  getFinancials,
  getScreenerPrices,
  FIN_YEARS,
  type YearFin,
} from "@/lib/data";
import {
  crore,
  croreCompact,
  pct,
  pctSigned,
  ratio,
  rupee,
  num,
  monthLabel,
  DASH,
} from "@/lib/format";

export function generateStaticParams() {
  return STOCK_IDS.map((ticker) => ({ ticker }));
}

export function generateMetadata({ params }: { params: Promise<{ ticker: string }> }) {
  return params.then(({ ticker }) => {
    const m = getStockMeta(ticker);
    return { title: m ? `${m.name} - June 2021 time capsule` : "Stock" };
  });
}

const CAT_STYLE: Record<string, string> = {
  Large: "border-accent/30 bg-accent/10 text-accent",
  Mid: "border-[#8b7cf6]/30 bg-[#8b7cf6]/10 text-[#a996ff]",
  Small: "border-warn/30 bg-warn/10 text-warn",
  Micro: "border-neg/30 bg-neg/10 text-neg",
};

/* ---------------- primitives ---------------- */

function Panel({
  id,
  title,
  meta,
  note,
  children,
}: {
  id?: string;
  title: string;
  meta?: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-32 overflow-hidden rounded-xl border border-line bg-ink-850/50"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        {meta && <span className="text-xs text-fg-dim">{meta}</span>}
      </div>
      <div className="p-5">
        {note && <p className="mb-4 text-xs leading-relaxed text-fg-dim">{note}</p>}
        {children}
      </div>
    </section>
  );
}

/** Key-figure tile used in the snapshot strip. */
function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="text-[10px] uppercase tracking-wider text-fg-dim">
        {label}
      </div>
      <div className="tnum mt-1 text-[17px] font-semibold text-fg">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] text-fg-dim">{hint}</div>}
    </div>
  );
}

function Na() {
  return <span className="text-fg-dim/60">n/a</span>;
}

/** Inline callout. `tone` maps to the semantic colours, never decorative ones. */
function Callout({
  tone,
  children,
}: {
  tone: "warn" | "neg" | "neutral";
  children: React.ReactNode;
}) {
  const styles = {
    warn: "border-warn/25 bg-warn/[0.07] text-warn",
    neg: "border-neg/25 bg-neg/[0.07] text-neg",
    neutral: "border-line-strong bg-ink-800 text-fg-muted",
  }[tone];
  return (
    <div className={`rounded-lg border px-4 py-2.5 text-xs leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

function SubNav() {
  const items = [
    ["chart", "Price chart"],
    ["pnl", "Profit & Loss"],
    ["cashflow", "Cash flow"],
    ["peers", "Peers"],
  ];
  return (
    <nav
      aria-label="Sections"
      className="sticky top-[57px] z-20 -mx-5 mb-6 flex gap-1 overflow-x-auto border-b border-line bg-ink-900/90 px-5 py-2.5 backdrop-blur-md thin-scroll"
    >
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium text-fg-muted transition-colors duration-200 hover:bg-ink-850 hover:text-fg"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

/* ---------------- page ---------------- */

export default async function StockDetail({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const meta = getStockMeta(ticker);
  const snap = getSnapshot(ticker);
  if (!meta || !snap) notFound();

  const fin = getFinancials(ticker);
  const prices = getScreenerPrices(ticker);

  const get = (y: string, k: keyof YearFin): number | null => fin[y]?.[k] ?? null;

  const epsNote =
    snap.epsConsistencyNote ??
    "Not enough FY2015-FY2021 data to assess EPS consistency.";

  // EPS cells to flag: years inside a run of >=3 consecutive YoY declines.
  const epsDeclineYears = (() => {
    const vals = FIN_YEARS.map((y) => get(y, "eps"));
    const decl = vals.map(
      (v, i) =>
        i > 0 && v != null && vals[i - 1] != null && v < (vals[i - 1] as number),
    );
    const flag = new Set<string>();
    let i = 1;
    while (i < decl.length) {
      if (decl[i]) {
        let j = i;
        while (j < decl.length && decl[j]) j++;
        if (j - i >= 3) for (let k = i - 1; k <= j - 1; k++) flag.add(FIN_YEARS[k]);
        i = j;
      } else i++;
    }
    return flag;
  })();

  const peerIds = getPeerIds(ticker);
  const peerRows = [ticker, ...peerIds].map((id) => ({
    id,
    meta: getStockMeta(id)!,
    snap: getSnapshot(id)!,
  }));

  const startYear = prices.length ? prices[0].date.slice(0, 4) : DASH;

  return (
    <>
      <SiteHeader active="screener" context="Data frozen · June 2021" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px]">
          <Link
            href="/screener"
            className="text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            Screener
          </Link>
          <span aria-hidden className="text-fg-dim">
            /
          </span>
          <span className="font-medium text-fg">{meta.name}</span>
        </nav>

        {/* ---- Company header ---- */}
        <section className="mt-4 overflow-hidden rounded-xl border border-line bg-ink-850/50">
          <div className="flex flex-wrap items-start justify-between gap-4 p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-semibold tracking-tight text-fg">
                  {meta.name}
                </h1>
                {snap.marketCapCategory && (
                  <span
                    className={`rounded border px-2 py-0.5 text-[11px] font-medium ${
                      CAT_STYLE[snap.marketCapCategory]
                    }`}
                  >
                    {snap.marketCapCategory} cap
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-fg-dim">
                <span className="tnum font-medium text-fg-muted">{meta.id}</span>
                <span aria-hidden>·</span>
                <span>{meta.sector}</span>
                <span aria-hidden>·</span>
                <span>NSE</span>
              </div>
            </div>

            <div className="text-right">
              {snap.ipoMonth ? (
                <>
                  <div className="tnum text-2xl font-semibold text-fg-dim">
                    {DASH}
                  </div>
                  <div className="mt-0.5 text-[11px] font-medium text-warn">
                    Not listed · IPO {monthLabel(snap.ipoMonth)}
                  </div>
                </>
              ) : (
                <>
                  <div className="tnum text-2xl font-semibold text-fg">
                    {rupee(snap.price)}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-fg-dim">
                    Close · June 2021
                  </div>
                </>
              )}
            </div>
          </div>

          {snap.companyBlurb && (
            <div className="border-t border-line px-5 py-4">
              <p className="border-l-2 border-accent/60 pl-4 text-[14px] leading-relaxed text-fg-muted">
                {snap.companyBlurb}
              </p>
            </div>
          )}

          {(snap.ipoMonth || snap.negNetWorth) && (
            <div className="space-y-2 border-t border-line px-5 py-4">
              {snap.ipoMonth && (
                <Callout tone="warn">
                  <strong className="font-semibold">
                    Not yet listed as of June 2021.
                  </strong>{" "}
                  {meta.name} IPO&apos;d in {monthLabel(snap.ipoMonth)}, so
                  June-2021 snapshot ratios are unavailable. The simulator uses
                  its first listed close ({rupee(snap.effectiveEntry)}) as the
                  effective entry price.
                </Callout>
              )}
              {snap.negNetWorth && (
                <Callout tone="neg">
                  <strong className="font-semibold">
                    Negative net worth (FY2021).
                  </strong>{" "}
                  Accumulated losses exceed equity, so ROE and Debt/Equity are
                  not meaningful and are left blank.
                </Callout>
              )}
            </div>
          )}

          {/* Snapshot metrics - hairline grid, no nested cards. */}
          <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
            <div className="contents">
              <div className="bg-ink-900">
                <Metric label="Market Cap" value={croreCompact(snap.marketCap)} />
              </div>
              <div className="bg-ink-900">
                <Metric label="Stock P/E" value={ratio(snap.pe, 1)} />
              </div>
              <div className="bg-ink-900">
                <Metric
                  label="ROE"
                  value={snap.negNetWorth ? "N/A" : pct(snap.roe)}
                  hint={snap.negNetWorth ? "negative equity" : "FY2021"}
                />
              </div>
              <div className="bg-ink-900">
                <Metric label="Div Yield" value={pct(snap.dividendYield, 2)} />
              </div>
              <div className="bg-ink-900">
                <Metric
                  label="Debt / Equity"
                  value={snap.negNetWorth ? "N/A" : ratio(snap.debtToEquity, 2)}
                  hint={snap.negNetWorth ? "negative equity" : "FY2021"}
                />
              </div>
              <div className="bg-ink-900">
                <Metric
                  label="Promoter Hold."
                  value={pct(snap.promoterHolding, 2)}
                  hint={
                    snap.promoterHolding == null
                      ? "no promoter"
                      : snap.promoterHoldingAsOf === "2021"
                        ? "Jun 2021"
                        : `≈ FY${snap.promoterHoldingAsOf}*`
                  }
                />
              </div>
            </div>
          </dl>

          <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-fg-dim">
            Snapshot ratios derived from real FY2021 financials and the split-
            and bonus-adjusted June-2021 close.{" "}
            {snap.opm != null && <>Operating margin (OPM) FY2021: {pct(snap.opm)}. </>}
            {snap.promoterHoldingAsOf &&
              snap.promoterHoldingAsOf !== "2021" &&
              "* Promoter holding shown is the earliest figure available from screener (June-2021 value not published)."}
          </p>
        </section>

        <div className="mt-6">
          <SubNav />
        </div>

        <div className="space-y-6">
          {/* ---- Price chart ---- */}
          <Panel
            id="chart"
            title={`Price history · ${startYear} - June 2021`}
            meta="Monthly close"
            note={
              <>
                The long-term track record shown to participants{" "}
                <em>before</em> they pick. This chart never extends past June
                2021.
              </>
            }
          >
            {prices.length > 0 ? (
              <PriceChart data={prices} />
            ) : (
              <div className="grid h-72 place-items-center rounded-lg border border-dashed border-line-strong bg-ink-900 px-6 text-center text-sm leading-relaxed text-fg-dim">
                <span>
                  Not listed as of June 2021
                  {snap.ipoMonth ? ` — IPO ${monthLabel(snap.ipoMonth)}` : ""}.
                  <br />
                  No pre-June-2021 price history to display.
                </span>
              </div>
            )}
          </Panel>

          {/* ---- P&L ---- */}
          <Panel
            id="pnl"
            title="Profit & Loss"
            meta="₹ Crore"
            note="Year by year, FY2015-FY2021. Any unavailable year shows as n/a."
          >
            <div className="-mx-5 overflow-x-auto px-5 thin-scroll">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-right">
                    <th
                      scope="col"
                      className="py-2 text-left text-[11px] font-medium uppercase tracking-wider text-fg-dim"
                    >
                      Metric
                    </th>
                    {FIN_YEARS.map((y) => (
                      <th
                        key={y}
                        scope="col"
                        className="tnum px-2 py-2 text-[11px] font-medium text-fg-dim"
                      >
                        {y}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["Revenue", "revenue", crore],
                      ["Net Profit", "netProfit", crore],
                      [
                        "EPS (₹)",
                        "eps",
                        (v: number | null) => (v == null ? DASH : num(v, 2)),
                      ],
                    ] as const
                  ).map(([label, key, fmt]) => (
                    <tr
                      key={key}
                      className="border-b border-line/60 text-right last:border-b-0"
                    >
                      <th
                        scope="row"
                        className="py-2.5 text-left text-[13px] font-medium text-fg-muted"
                      >
                        {label}
                      </th>
                      {FIN_YEARS.map((y) => {
                        const v = get(y, key as keyof YearFin);
                        const red =
                          (key === "netProfit" && v != null && v < 0) ||
                          (key === "eps" && epsDeclineYears.has(y));
                        return (
                          <td
                            key={y}
                            className={`tnum px-2 py-2.5 ${
                              red ? "font-semibold text-neg" : "text-fg"
                            }`}
                          >
                            {v == null ? <Na /> : fmt(v)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <CagrCard
                title="Compounded revenue growth"
                three={snap.revenueGrowth3yr}
                five={snap.revenueGrowth5yr}
              />
              <CagrCard
                title="Compounded profit growth"
                three={snap.profitGrowth3yr}
                five={snap.profitGrowth5yr}
              />
            </div>

            <div className="mt-4">
              <Callout tone="warn">
                <strong className="font-semibold">EPS consistency:</strong>{" "}
                {epsNote}
              </Callout>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-fg-dim">
              Windows: 3-year (FY2018→FY2021) and 5-year (FY2016→FY2021). A
              window shows n/a where a required base year is missing, for
              example a stock that listed after FY2016.
            </p>
          </Panel>

          {/* ---- Cash flow ---- */}
          <Panel
            id="cashflow"
            title="Cash flow from operations"
            meta="₹ Crore"
            note="FY2015-FY2021. Negative operating cash flow is flagged in red."
          >
            <div className="-mx-5 overflow-x-auto px-5 thin-scroll">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-right">
                    <th
                      scope="col"
                      className="py-2 text-left text-[11px] font-medium uppercase tracking-wider text-fg-dim"
                    >
                      Metric
                    </th>
                    {FIN_YEARS.map((y) => (
                      <th
                        key={y}
                        scope="col"
                        className="tnum px-2 py-2 text-[11px] font-medium text-fg-dim"
                      >
                        {y}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="text-right">
                    <th
                      scope="row"
                      className="py-2.5 text-left text-[13px] font-medium text-fg-muted"
                    >
                      Cash from ops
                    </th>
                    {FIN_YEARS.map((y) => {
                      const v = get(y, "cfo");
                      return (
                        <td
                          key={y}
                          className={`tnum px-2 py-2.5 ${
                            v != null && v < 0
                              ? "font-semibold text-neg"
                              : "text-fg"
                          }`}
                        >
                          {v == null ? <Na /> : crore(v)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ---- Peers ---- */}
          <Panel
            id="peers"
            title={`Peer comparison · ${meta.sector}`}
            note={`Compared only against peers within these ${STOCK_IDS.length} stocks, all as of June 2021.`}
          >
            {hasNoPeers(ticker) ? (
              <p className="rounded-lg border border-line-strong bg-ink-800 px-4 py-3 text-sm text-fg-muted">
                {peerNote(ticker)}
              </p>
            ) : (
              <div className="-mx-5 overflow-x-auto px-5 thin-scroll">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-right">
                      <th
                        scope="col"
                        className="py-2 text-left text-[11px] font-medium uppercase tracking-wider text-fg-dim"
                      >
                        Company
                      </th>
                      {["P/E", "Div Yield", "ROE", "D/E", "Market Cap"].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="px-2 py-2 text-[11px] font-medium uppercase tracking-wider text-fg-dim"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {peerRows.map(({ id, meta: m, snap: s }) => {
                      const self = id === ticker;
                      return (
                        <tr
                          key={id}
                          className={`border-b border-line/60 text-right last:border-b-0 ${
                            self ? "bg-accent/[0.07]" : ""
                          }`}
                        >
                          <th scope="row" className="py-2.5 text-left font-normal">
                            {self ? (
                              <span className="font-semibold text-accent">
                                {m.name}
                              </span>
                            ) : (
                              <Link
                                href={`/screener/${id}`}
                                className="text-fg-muted transition-colors duration-200 hover:text-accent"
                              >
                                {m.name}
                              </Link>
                            )}
                          </th>
                          <td className="tnum px-2 py-2.5 text-fg">
                            {ratio(s.pe, 1)}
                          </td>
                          <td className="tnum px-2 py-2.5 text-fg">
                            {pct(s.dividendYield, 2)}
                          </td>
                          <td className="tnum px-2 py-2.5 text-fg">{pct(s.roe)}</td>
                          <td className="tnum px-2 py-2.5 text-fg">
                            {ratio(s.debtToEquity, 2)}
                          </td>
                          <td className="tnum px-2 py-2.5 text-fg">
                            {croreCompact(s.marketCap)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function CagrCard({
  title,
  three,
  five,
}: {
  title: string;
  three: number | null;
  five: number | null;
}) {
  const cell = (label: string, v: number | null) => (
    <div className="flex-1 rounded-lg border border-line bg-ink-900 px-3 py-2.5 text-center">
      <div className="text-[10px] uppercase tracking-wider text-fg-dim">
        {label}
      </div>
      <div
        className={`tnum mt-1 text-[15px] font-semibold ${
          v == null ? "text-fg-dim/60" : v >= 0 ? "text-pos" : "text-neg"
        }`}
      >
        {v == null ? "n/a" : pctSigned(v)}
      </div>
    </div>
  );
  return (
    <div className="rounded-lg border border-line bg-ink-850 p-3">
      <div className="mb-2.5 text-[12px] font-medium text-fg-muted">{title}</div>
      <div className="flex gap-2">
        {cell("3 Yr", three)}
        {cell("5 Yr", five)}
      </div>
    </div>
  );
}
