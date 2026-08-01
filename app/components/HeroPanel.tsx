import { PROJECT } from "@/lib/stats";

/*
  Hero visual: a static, self-contained rendering of a simulator result.

  Deliberately not a screenshot and not a browser-chrome mockup - it is built
  from the same tokens as the real app, so it reads as a live panel lifted out
  of the product. Pure SVG, no client JS.
*/

// Deterministic sample series. A portfolio that beats the index, with the
// drawdown you'd actually expect rather than a clean upward sweep.
const PORTFOLIO = [
  100, 104, 101, 108, 114, 111, 119, 126, 122, 131, 128, 137, 145, 141, 150,
  158, 154, 163, 172, 168, 177, 185, 181, 190, 198,
];
const NIFTY = [
  100, 102, 99, 104, 107, 104, 109, 113, 110, 115, 113, 118, 122, 119, 124, 128,
  125, 130, 134, 131, 136, 140, 137, 142, 146,
];

const W = 320;
const H = 150;

function build(series: number[], min: number, max: number) {
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * (H - 12) - 6;
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  return { line, area, last: pts[pts.length - 1] };
}

export default function HeroPanel() {
  const all = [...PORTFOLIO, ...NIFTY];
  const min = Math.min(...all) - 4;
  const max = Math.max(...all) + 4;

  const p = build(PORTFOLIO, min, max);
  const n = build(NIFTY, min, max);

  const portfolioReturn = PORTFOLIO[PORTFOLIO.length - 1] - 100;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink-850 shadow-2xl shadow-ink-950/60">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div>
          <p className="text-[13px] font-semibold text-fg">
            Indexed performance
          </p>
          <p className="mt-0.5 text-[11px] text-fg-dim">
            100 = June 2021 · Fresh Graduate
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-pos/25 bg-pos/10 px-2.5 py-1">
          <span className="text-[11px] font-medium text-pos">Score</span>
          <span className="tnum text-sm font-semibold text-pos">8.0</span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-3 pt-4">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-44 w-full"
          role="img"
          aria-label={`Sample backtest: a portfolio returning ${portfolioReturn} percent against the Nifty 50 benchmark at ${PROJECT.niftyReturn} percent, June 2021 to June 2026.`}
        >
          <defs>
            <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d8dff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4d8dff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1="0"
              x2={W}
              y1={12 + i * 42}
              y2={12 + i * 42}
              stroke="#1c2537"
              strokeWidth="1"
            />
          ))}

          <path d={p.area} fill="url(#heroFill)" />
          <path
            d={n.line}
            fill="none"
            stroke="#7c8aa4"
            strokeWidth="1.6"
            strokeDasharray="5 4"
            strokeLinecap="round"
          />
          <path
            d={p.line}
            fill="none"
            stroke="#4d8dff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={p.last[0]} cy={p.last[1]} r="3.5" fill="#4d8dff" />
          <circle
            cx={p.last[0]}
            cy={p.last[1]}
            r="7"
            fill="#4d8dff"
            fillOpacity="0.18"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 pb-4 pt-2 text-[11px]">
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span aria-hidden className="h-0.5 w-5 rounded bg-accent" />
          Portfolio
        </span>
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span
            aria-hidden
            className="h-0.5 w-5 rounded"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #7c8aa4 0 4px, transparent 4px 7px)",
            }}
          />
          Nifty 50
        </span>
      </div>

      {/* Footer figures - the same tabular treatment the app uses. */}
      <dl className="grid grid-cols-3 divide-x divide-line border-t border-line">
        {[
          {
            label: "Portfolio",
            value: `+${portfolioReturn.toFixed(1)}%`,
            tone: "text-pos",
          },
          {
            label: "Nifty 50",
            value: `+${PROJECT.niftyReturn}%`,
            tone: "text-fg-muted",
          },
          {
            label: "Alpha",
            value: `+${(portfolioReturn - PROJECT.niftyReturn).toFixed(1)}%`,
            tone: "text-pos",
          },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3.5">
            <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
              {s.label}
            </dt>
            <dd className={`tnum mt-1 text-[15px] font-semibold ${s.tone}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
