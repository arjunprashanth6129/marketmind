import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
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
import { cagr } from "@/lib/calc";
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
    return { title: m ? `${m.name} — June 2021 time capsule` : "Stock" };
  });
}

const CAT_COLORS: Record<string, string> = {
  Large: "bg-blue-100 text-blue-800",
  Mid: "bg-purple-100 text-purple-800",
  Small: "bg-orange-100 text-orange-800",
  Micro: "bg-red-100 text-red-800",
};

function Chip({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="tnum text-base font-bold text-gray-900">{value}</div>
      {hint && <div className="text-[10px] text-gray-400">{hint}</div>}
    </div>
  );
}

function Na() {
  return <span className="text-gray-300">n/a</span>;
}

function SubNav() {
  const items = [
    ["chart", "Price chart"],
    ["pnl", "Profit & Loss"],
    ["cashflow", "Cash Flow"],
    ["peers", "Peers"],
  ];
  return (
    <nav className="sticky top-[57px] z-10 -mx-4 mb-6 flex gap-1 overflow-x-auto border-b border-gray-200 bg-[var(--background)]/95 px-4 py-2 text-sm backdrop-blur thin-scroll">
      {items.map(([id, label]) => (
        <a
          key={id}
          href={`#${id}`}
          className="whitespace-nowrap rounded-md px-3 py-1 font-medium text-gray-600 hover:bg-white hover:text-[var(--color-brand)]"
        >
          {label}
        </a>
      ))}
    </nav>
  );
}

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

  const get = (y: string, k: keyof YearFin): number | null =>
    fin[y]?.[k] ?? null;

  // CAGR windows: 1yr (FY20→21), 3yr (FY18→21), 5yr (FY16→21).
  const revC = {
    one: cagr(get("2020", "revenue"), get("2021", "revenue"), 1),
    three: cagr(get("2018", "revenue"), get("2021", "revenue"), 3),
    five: cagr(get("2016", "revenue"), get("2021", "revenue"), 5),
  };
  const npC = {
    one: cagr(get("2020", "netProfit"), get("2021", "netProfit"), 1),
    three: cagr(get("2018", "netProfit"), get("2021", "netProfit"), 3),
    five: cagr(get("2016", "netProfit"), get("2021", "netProfit"), 5),
  };
  // EPS-consistency over the full FY2015→FY2021 trend.
  const epsTrend = cagr(get("2015", "eps"), get("2021", "eps"), 6);
  const npTrend = cagr(get("2015", "netProfit"), get("2021", "netProfit"), 6);

  let epsNote: string;
  if (epsTrend == null || npTrend == null) {
    epsNote =
      "Not enough FY2015–FY2021 data to compare EPS growth with profit growth.";
  } else if (epsTrend >= npTrend - 1.5) {
    epsNote =
      "EPS growth tracks net-profit growth (FY2015→FY2021) — no major equity dilution.";
  } else {
    epsNote =
      "EPS growth lags net-profit growth (FY2015→FY2021) — equity dilution likely.";
  }

  const peerIds = getPeerIds(ticker);
  const peerRows = [ticker, ...peerIds].map((id) => ({
    id,
    meta: getStockMeta(id)!,
    snap: getSnapshot(id)!,
  }));

  const startYear = prices.length ? prices[0].date.slice(0, 4) : "—";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link
          href="/screener"
          className="text-sm text-gray-500 hover:text-[var(--color-brand)]"
        >
          ← All stocks
        </Link>

        {/* ---- Header ---- */}
        <section className="mt-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{meta.name}</h1>
                {snap.marketCapCategory && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      CAT_COLORS[snap.marketCapCategory]
                    }`}
                  >
                    {snap.marketCapCategory} cap
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                <span className="font-mono">{meta.id}</span>
                <span>·</span>
                <span>{meta.sector}</span>
                <span>·</span>
                <span>NSE</span>
              </div>
            </div>
            <div className="text-right">
              {snap.ipoMonth ? (
                <>
                  <div className="tnum text-2xl font-bold text-gray-400">—</div>
                  <div className="text-[11px] font-medium text-amber-700">
                    Not listed · IPO {monthLabel(snap.ipoMonth)}
                  </div>
                </>
              ) : (
                <>
                  <div className="tnum text-2xl font-bold text-gray-900">
                    {rupee(snap.price)}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-400">
                    Close · June 2021
                  </div>
                </>
              )}
            </div>
          </div>

          {snap.ipoMonth && (
            <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <strong>Not yet listed as of June 2021.</strong> {meta.name} IPO&apos;d
              in {monthLabel(snap.ipoMonth)}, so June-2021 snapshot ratios are
              unavailable. The simulator uses its first listed close (
              {rupee(snap.effectiveEntry)}) as the effective entry price.
            </div>
          )}
          {snap.negNetWorth && (
            <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
              <strong>Negative net worth (FY2021).</strong> Accumulated losses
              exceed equity, so ROE and Debt/Equity are not meaningful and are
              left blank.
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Chip label="Market Cap" value={croreCompact(snap.marketCap)} />
            <Chip label="Stock P/E" value={ratio(snap.pe, 1)} />
            <Chip label="ROE" value={pct(snap.roe)} hint="FY2021" />
            <Chip label="Div Yield" value={pct(snap.divYield, 2)} />
            <Chip
              label="Debt / Equity"
              value={snap.negNetWorth ? "N/A" : ratio(snap.de, 2)}
              hint={snap.negNetWorth ? "negative equity" : "FY2021"}
            />
            <Chip
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
          <p className="mt-3 text-[11px] text-gray-400">
            Snapshot ratios derived from real FY2021 financials and the
            split/bonus-adjusted June-2021 close.{" "}
            {snap.opm != null && (
              <>Operating margin (OPM) FY2021: {pct(snap.opm)}. </>
            )}
            {snap.promoterHoldingAsOf &&
              snap.promoterHoldingAsOf !== "2021" &&
              "* Promoter holding shown is the earliest figure available from screener (June-2021 value not published)."}
          </p>
        </section>

        <div className="mt-6">
          <SubNav />
        </div>

        {/* ---- Price chart ---- */}
        <section id="chart" className="scroll-mt-28 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Price history · {startYear} – June 2021
            </h2>
            <span className="text-xs text-gray-400">monthly close</span>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Long-term track record shown to participants <em>before</em> they
            pick. This chart never extends past June 2021.
          </p>
          {prices.length > 0 ? (
            <PriceChart data={prices} />
          ) : (
            <div className="grid h-72 place-items-center rounded-md bg-gray-50 text-center text-sm text-gray-500">
              <span>
                Not listed as of June 2021
                {snap.ipoMonth ? ` — IPO ${monthLabel(snap.ipoMonth)}` : ""}.
                <br />
                No pre-June-2021 price history to display.
              </span>
            </div>
          )}
        </section>

        {/* ---- P&L ---- */}
        <section id="pnl" className="mt-6 scroll-mt-28 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Profit &amp; Loss
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Year-by-year, FY2015–FY2021 (₹ Crore). Any unavailable year shows as{" "}
            <span className="text-gray-400">n/a</span>.
          </p>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-right text-xs text-gray-500">
                  <th className="py-2 text-left font-medium">Metric</th>
                  {FIN_YEARS.map((y) => (
                    <th key={y} className="px-2 py-2 font-medium">
                      FY{y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tnum">
                {(
                  [
                    ["Revenue", "revenue", crore],
                    ["Net Profit", "netProfit", crore],
                    ["EPS (₹)", "eps", (v: number | null) => (v == null ? DASH : num(v, 2))],
                  ] as const
                ).map(([label, key, fmt]) => (
                  <tr key={key} className="border-b border-gray-100 text-right">
                    <td className="py-2 text-left font-medium text-gray-700">
                      {label}
                    </td>
                    {FIN_YEARS.map((y) => {
                      const v = get(y, key as keyof YearFin);
                      return (
                        <td key={y} className="px-2 py-2 text-gray-800">
                          {v == null ? <Na /> : fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CAGR rows */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CagrCard
              title="Compounded Revenue Growth"
              one={revC.one}
              three={revC.three}
              five={revC.five}
            />
            <CagrCard
              title="Compounded Profit Growth"
              one={npC.one}
              three={npC.three}
              five={npC.five}
            />
          </div>
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <strong>EPS consistency:</strong> {epsNote}
          </p>
          <p className="mt-2 text-[11px] text-gray-400">
            Windows: 1-Yr (FY20→FY21), 3-Yr (FY18→FY21), 5-Yr (FY16→FY21). A
            window shows n/a only where a required year is missing (e.g. PAYTM,
            which lacks FY2017–FY2018).
          </p>
        </section>

        {/* ---- Cash Flow ---- */}
        <section id="cashflow" className="mt-6 scroll-mt-28 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Cash Flow from Operations
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            FY2015–FY2021 (₹ Crore). Negative operating cash flow is flagged in
            red.
          </p>
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-right text-xs text-gray-500">
                  <th className="py-2 text-left font-medium">Metric</th>
                  {FIN_YEARS.map((y) => (
                    <th key={y} className="px-2 py-2 font-medium">
                      FY{y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="tnum">
                <tr className="text-right">
                  <td className="py-2 text-left font-medium text-gray-700">
                    Cash from Ops
                  </td>
                  {FIN_YEARS.map((y) => {
                    const v = get(y, "cfo");
                    return (
                      <td
                        key={y}
                        className={`px-2 py-2 ${
                          v != null && v < 0
                            ? "font-semibold text-[var(--color-neg)]"
                            : "text-gray-800"
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
        </section>

        {/* ---- Peers ---- */}
        <section id="peers" className="mt-6 scroll-mt-28 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">
            Peer comparison · {meta.sector}
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Compared only against peers within these {STOCK_IDS.length} stocks,
            all as of June 2021.
          </p>
          {hasNoPeers(ticker) ? (
            <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {peerNote(ticker)}
            </p>
          ) : (
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-right text-xs text-gray-500">
                    <th className="py-2 text-left font-medium">Company</th>
                    <th className="px-2 py-2 font-medium">P/E</th>
                    <th className="px-2 py-2 font-medium">Div Yield</th>
                    <th className="px-2 py-2 font-medium">ROE</th>
                    <th className="px-2 py-2 font-medium">D/E</th>
                    <th className="px-2 py-2 font-medium">Market Cap</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {peerRows.map(({ id, meta: m, snap: s }) => {
                    const self = id === ticker;
                    return (
                      <tr
                        key={id}
                        className={`border-b border-gray-100 text-right ${
                          self ? "bg-blue-50/60" : ""
                        }`}
                      >
                        <td className="py-2 text-left">
                          {self ? (
                            <span className="font-semibold text-[var(--color-brand)]">
                              {m.name}
                            </span>
                          ) : (
                            <Link
                              href={`/screener/${id}`}
                              className="text-gray-700 hover:text-[var(--color-brand)] hover:underline"
                            >
                              {m.name}
                            </Link>
                          )}
                        </td>
                        <td className="px-2 py-2 text-gray-800">{ratio(s.pe, 1)}</td>
                        <td className="px-2 py-2 text-gray-800">{pct(s.divYield, 2)}</td>
                        <td className="px-2 py-2 text-gray-800">{pct(s.roe)}</td>
                        <td className="px-2 py-2 text-gray-800">{ratio(s.de, 2)}</td>
                        <td className="px-2 py-2 text-gray-800">
                          {croreCompact(s.marketCap)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-xs text-gray-400">
          Time capsule · data frozen at June 2021 · fixed reproducible dataset
        </p>
      </main>
    </>
  );
}

function CagrCard({
  title,
  one,
  three,
  five,
}: {
  title: string;
  one: number | null;
  three: number | null;
  five: number | null;
}) {
  const cell = (label: string, v: number | null) => (
    <div className="flex-1 rounded-md bg-gray-50 px-2 py-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div
        className={`tnum text-sm font-bold ${
          v == null
            ? "text-gray-300"
            : v >= 0
              ? "text-[var(--color-pos)]"
              : "text-[var(--color-neg)]"
        }`}
      >
        {v == null ? "n/a" : pctSigned(v)}
      </div>
    </div>
  );
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="mb-2 text-xs font-semibold text-gray-700">{title}</div>
      <div className="flex gap-2">
        {cell("1 Yr", one)}
        {cell("3 Yr", three)}
        {cell("5 Yr", five)}
      </div>
    </div>
  );
}
