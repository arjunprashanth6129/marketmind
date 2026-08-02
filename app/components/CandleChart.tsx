"use client";

/**
 * Monthly OHLC candlestick chart.
 *
 * Hand-rolled SVG rather than a charting library: candles are a handful of
 * rects and lines, and doing it directly keeps the design tokens, the tabular
 * tooltip and the reduced-motion behaviour consistent with the rest of the app
 * without pulling in a second chart runtime alongside Recharts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Candle } from "@/lib/data";
import { monthLabel, rupee } from "@/lib/format";

const PAD = { top: 12, right: 12, bottom: 26, left: 52 };
const MIN_BODY = 1.25; // px - a doji still needs to be visible

export default function CandleChart({
  data,
  height = 288,
  showAxisLabels = true,
}: {
  data: Candle[];
  height?: number;
  showAxisLabels?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);

  // Measure rather than rely on a viewBox, so candle strokes stay crisp and
  // one-pixel wicks never get scaled into blurry smears.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = Math.max(0, height - PAD.top - PAD.bottom);

  let lo = Infinity;
  let hi = -Infinity;
  for (const c of data) {
    if (c.l < lo) lo = c.l;
    if (c.h > hi) hi = c.h;
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  const span = hi - lo || 1;
  lo -= span * 0.04;
  hi += span * 0.04;

  const y = useCallback(
    (v: number) => PAD.top + plotH - ((v - lo) / (hi - lo)) * plotH,
    [plotH, lo, hi],
  );

  const step = data.length ? plotW / data.length : 0;
  const bodyW = Math.max(1, Math.min(9, step * 0.62));

  // Round y-axis ticks to something a human would choose. Includes 2.5 in the
  // nice-number set, without which a range like 0-800 collapses to a single
  // 500 step and the axis ends up with two labels.
  const ticks = (() => {
    const target = 5;
    const raw = (hi - lo) / target;
    if (!Number.isFinite(raw) || raw <= 0) return [];
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const nice =
      (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) *
      mag;
    const out: number[] = [];
    for (let v = Math.ceil(lo / nice) * nice; v <= hi; v += nice) out.push(v);
    return out;
  })();

  // One label per year, thinned out so they never collide.
  const yearTicks = (() => {
    const seen = new Map<string, number>();
    data.forEach((c, i) => {
      const yr = c.date.slice(0, 4);
      if (!seen.has(yr)) seen.set(yr, i);
    });
    const entries = [...seen.entries()];
    const every = Math.max(1, Math.ceil(entries.length / (plotW > 560 ? 11 : 6)));
    return entries.filter((_, i) => i % every === 0);
  })();

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!step) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const idx = Math.floor((e.clientX - rect.left - PAD.left) / step);
    setHover(idx >= 0 && idx < data.length ? idx : null);
  };

  const active = hover != null ? data[hover] : null;

  if (!data.length) {
    return (
      <div
        style={{ height }}
        className="grid place-items-center rounded-lg border border-dashed border-line-strong bg-ink-900 text-sm text-fg-dim"
      >
        No candle data available for this stock.
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label={`Monthly candlestick chart, ${monthLabel(
            data[0].date,
          )} to ${monthLabel(data[data.length - 1].date)}.`}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="#1c2537"
                strokeWidth={1}
              />
              {showAxisLabels && (
                <text
                  x={PAD.left - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={11}
                  fill="#7c8aa4"
                  fontFamily="var(--font-jet), ui-monospace, monospace"
                >
                  {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(0)}
                </text>
              )}
            </g>
          ))}

          {showAxisLabels &&
            yearTicks.map(([yr, i]) => (
              <text
                key={yr}
                x={PAD.left + i * step + step / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize={11}
                fill="#7c8aa4"
                fontFamily="var(--font-jet), ui-monospace, monospace"
              >
                {yr}
              </text>
            ))}

          {data.map((c, i) => {
            const up = c.c >= c.o;
            const colour = up ? "#2fbf71" : "#f1566a";
            const cx = PAD.left + i * step + step / 2;
            const top = y(Math.max(c.o, c.c));
            const bottom = y(Math.min(c.o, c.c));
            const h = Math.max(MIN_BODY, bottom - top);
            const dim = hover != null && hover !== i;
            return (
              <g key={c.date} opacity={dim ? 0.32 : 1}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={y(c.h)}
                  y2={y(c.l)}
                  stroke={colour}
                  strokeWidth={1}
                />
                <rect
                  x={cx - bodyW / 2}
                  y={top}
                  width={bodyW}
                  height={h}
                  fill={up ? "transparent" : colour}
                  stroke={colour}
                  strokeWidth={1}
                />
              </g>
            );
          })}

          {hover != null && (
            <line
              x1={PAD.left + hover * step + step / 2}
              x2={PAD.left + hover * step + step / 2}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="#2a3651"
              strokeWidth={1}
            />
          )}
        </svg>
      )}

      {active && (
        <div
          className="pointer-events-none absolute top-2 rounded-lg border border-line-strong bg-ink-800 px-3 py-2 shadow-xl shadow-ink-950/50"
          style={{
            left: Math.min(
              Math.max(PAD.left, PAD.left + (hover ?? 0) * step - 60),
              Math.max(PAD.left, width - 150),
            ),
          }}
        >
          <div className="text-[11px] font-medium text-fg-dim">
            {monthLabel(active.date)}
          </div>
          <dl className="mt-1 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-[11px]">
            {(
              [
                ["O", active.o],
                ["H", active.h],
                ["L", active.l],
                ["C", active.c],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-fg-dim">{k}</dt>
                <dd
                  className={`tnum text-right ${
                    k === "C"
                      ? active.c >= active.o
                        ? "font-semibold text-pos"
                        : "font-semibold text-neg"
                      : "text-fg"
                  }`}
                >
                  {rupee(v)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
