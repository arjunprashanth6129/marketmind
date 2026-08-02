"use client";

import { useMemo, useState } from "react";
import PerfChart from "./PerfChart";
import CandleChart from "../components/CandleChart";
import ChartToggle, { type ChartMode } from "../components/ChartToggle";
import type { TimelinePoint } from "@/lib/calc";
import type { Candle } from "@/lib/data";

/**
 * Simulator performance panel: indexed line chart, or the portfolio drawn as
 * monthly candles.
 *
 * The candle body is real - open is the previous month's index, close is this
 * month's. The wick is an *envelope*: the weighted sum of each holding's
 * monthly high and low. Because holdings do not peak on the same day, that is
 * the outer bound of where the portfolio could have traded rather than a
 * realised high, and the caption says so.
 */
export default function PerfPanel({
  data,
  accent,
}: {
  data: TimelinePoint[];
  accent: string;
}) {
  const [mode, setMode] = useState<ChartMode>("line");

  const candles = useMemo<Candle[]>(
    () =>
      data
        .filter((p) => p.high != null && p.low != null)
        .map((p) => ({
          date: p.date,
          o: p.open,
          h: p.high as number,
          l: p.low as number,
          c: p.portfolio,
        })),
    [data],
  );

  const hasCandles = candles.length > 1;
  const active = hasCandles ? mode : "line";

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-ink-850/50">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-fg">
          Indexed performance
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-fg-dim">100 = June 2021</span>
          {hasCandles && <ChartToggle mode={active} onChange={setMode} />}
        </div>
      </div>
      <div className="p-5">
        <p className="mb-4 text-xs leading-relaxed text-fg-dim">
          {active === "line" ? (
            <>
              Solid line is your portfolio; dashed is the Nifty 50, the
              benchmark you&apos;re scored against.
            </>
          ) : (
            <>
              Body spans last month&apos;s close to this month&apos;s. The wick
              is an envelope — the weighted high and low of your holdings — not
              a realised high, since they don&apos;t peak on the same day.
            </>
          )}
        </p>
        {active === "line" ? (
          <PerfChart data={data} accent={accent} />
        ) : (
          <CandleChart data={candles} height={320} />
        )}
      </div>
    </section>
  );
}
