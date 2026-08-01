"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { monthLabel, rupee } from "@/lib/format";

interface Pt {
  date: string;
  close: number;
}

// Render the chart only after hydration (recharts measures the DOM).
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function TooltipBox({ active, payload }: { active?: boolean; payload?: { payload: Pt }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as Pt;
  return (
    <div className="rounded-lg border border-line-strong bg-ink-800 px-3 py-2 shadow-xl shadow-ink-950/50">
      <div className="text-[11px] font-medium text-fg-dim">
        {monthLabel(p.date)}
      </div>
      <div className="tnum mt-0.5 text-sm font-semibold text-fg">
        {rupee(p.close)}
      </div>
    </div>
  );
}

export default function PriceChart({ data }: { data: Pt[] }) {
  // Year ticks only (data is monthly), every ~2 years to avoid crowding.
  const years = new Map<string, string>();
  for (const d of data) {
    const y = d.date.slice(0, 4);
    if (!years.has(y)) years.set(y, d.date);
  }
  const ticks = Array.from(years.values()).filter(
    (_, i) => i % 2 === 0,
  );

  const mounted = useMounted();
  // Reserve the exact final height so hydration doesn't shift the layout.
  if (!mounted)
    return <div className="h-72 w-full rounded-lg border border-line bg-ink-900" />;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d8dff" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#4d8dff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1c2537" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(d: string) => d.slice(0, 4)}
            tick={{ fontSize: 11, fill: "#7c8aa4" }}
            tickLine={false}
            axisLine={{ stroke: "#1c2537" }}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#7c8aa4" }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
            }
            tickLine={false}
            axisLine={false}
            width={44}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={<TooltipBox />}
            cursor={{ stroke: "#2a3651", strokeWidth: 1 }}
          />
          {data.length > 0 && (
            <ReferenceLine
              x={data[data.length - 1].date}
              stroke="#4d8dff"
              strokeDasharray="4 3"
              strokeOpacity={0.6}
              label={{
                value: "June 2021 · sim start",
                position: "insideTopRight",
                fill: "#4d8dff",
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="close"
            stroke="#4d8dff"
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={false}
            activeDot={{ r: 3.5, fill: "#4d8dff", stroke: "#0b0f18", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
