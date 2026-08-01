"use client";

import { useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { monthLabel } from "@/lib/format";
import type { TimelinePoint } from "@/lib/calc";

// Render the chart only after hydration (recharts measures the DOM).
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

interface TooltipBoxProps {
  active?: boolean;
  payload?: { payload: TimelinePoint }[];
  accent?: string;
}

function TooltipBox({ active, payload, accent }: TooltipBoxProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as TimelinePoint;
  return (
    <div className="rounded-lg border border-line-strong bg-ink-800 px-3 py-2 shadow-xl shadow-ink-950/50">
      <div className="mb-1.5 text-[11px] font-medium text-fg-dim">
        {monthLabel(p.date)}
      </div>
      <div className="tnum text-[13px] font-medium" style={{ color: accent }}>
        Portfolio {p.portfolio.toFixed(1)}
      </div>
      {p.nifty != null && (
        <div className="tnum mt-0.5 text-[13px] text-fg-muted">
          Nifty 50 {p.nifty.toFixed(1)}
        </div>
      )}
    </div>
  );
}

export default function PerfChart({
  data,
  accent = "#60a5fa",
  showNifty = true,
}: {
  data: TimelinePoint[];
  accent?: string;
  showNifty?: boolean;
}) {
  const years = new Map<string, string>();
  for (const d of data) {
    const y = d.date.slice(0, 4);
    if (!years.has(y)) years.set(y, d.date);
  }
  const ticks = Array.from(years.values());

  const mounted = useMounted();
  // Reserve the exact final height so hydration doesn't shift the layout.
  if (!mounted)
    return <div className="h-80 w-full rounded-lg border border-line bg-ink-900" />;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="#1c2537" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(d: string) => d.slice(0, 4)}
            tick={{ fontSize: 11, fill: "#7c8aa4" }}
            tickLine={false}
            axisLine={{ stroke: "#1c2537" }}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#7c8aa4" }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={["auto", "auto"]}
          />
          {/* The 100 baseline: everything above it is real gain. */}
          <ReferenceLine y={100} stroke="#2a3651" strokeDasharray="4 4" />
          <Tooltip
            content={<TooltipBox accent={accent} />}
            cursor={{ stroke: "#2a3651", strokeWidth: 1 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#9aa8c0", paddingTop: 8 }}
            iconType="plainline"
          />
          <Line
            name="Your portfolio"
            type="monotone"
            dataKey="portfolio"
            stroke={accent}
            strokeWidth={2.4}
            dot={false}
            activeDot={{ r: 4, stroke: "#0b0f18", strokeWidth: 2 }}
          />
          {showNifty && (
            <Line
              name="Nifty 50 (benchmark)"
              type="monotone"
              dataKey="nifty"
              stroke="#7c8aa4"
              strokeWidth={1.8}
              strokeDasharray="6 4"
              dot={false}
              activeDot={{ r: 3.5, stroke: "#0b0f18", strokeWidth: 2 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
