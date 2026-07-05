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
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <div className="font-medium text-gray-500">{monthLabel(p.date)}</div>
      <div className="tnum text-sm font-bold text-gray-900">
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
  if (!mounted) return <div className="h-72 w-full rounded-md bg-gray-50" />;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2451b3" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2451b3" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(d: string) => d.slice(0, 4)}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
            minTickGap={20}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
            }
            tickLine={false}
            axisLine={false}
            width={44}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<TooltipBox />} />
          {data.length > 0 && (
            <ReferenceLine
              x={data[data.length - 1].date}
              stroke="#2451b3"
              strokeDasharray="4 3"
              strokeOpacity={0.5}
              label={{
                value: "June 2021 · sim start",
                position: "insideTopRight",
                fill: "#2451b3",
                fontSize: 10,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="close"
            stroke="#2451b3"
            strokeWidth={1.8}
            fill="url(#priceFill)"
            dot={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
