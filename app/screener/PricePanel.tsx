"use client";

import { useState } from "react";
import PriceChart from "./PriceChart";
import CandleChart from "../components/CandleChart";
import ChartToggle, { type ChartMode } from "../components/ChartToggle";
import type { Candle } from "@/lib/data";

/**
 * Price history panel: line/area by default, real monthly candles on toggle.
 *
 * Candles come from data/ohlc.json, aggregated from daily bars and re-anchored
 * so every close matches the close the line chart draws. Three delisted
 * tickers have no candle data and only get the line view.
 */
export default function PricePanel({
  title,
  prices,
  candles,
}: {
  title: string;
  prices: { date: string; close: number }[];
  candles: Candle[];
}) {
  const [mode, setMode] = useState<ChartMode>("line");
  const hasCandles = candles.length > 0;
  const active = hasCandles ? mode : "line";

  return (
    <section
      id="chart"
      className="scroll-mt-32 overflow-hidden rounded-xl border border-line bg-ink-850/50"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-fg-dim">Monthly</span>
          {hasCandles && <ChartToggle mode={active} onChange={setMode} />}
        </div>
      </div>
      <div className="p-5">
        <p className="mb-4 text-xs leading-relaxed text-fg-dim">
          The long-term track record shown to participants <em>before</em> they
          pick. This chart never extends past June 2021.
          {!hasCandles && " Candle data is unavailable for this ticker."}
        </p>
        {active === "line" ? (
          <PriceChart data={prices} />
        ) : (
          <CandleChart data={candles} />
        )}
      </div>
    </section>
  );
}
