"use client";

import { useEffect, useState } from "react";
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

function TooltipBox({ active, payload, accent }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as TimelinePoint;
  return (
    <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-medium text-slate-400">{monthLabel(p.date)}</div>
      <div className="tnum" style={{ color: accent }}>
        Portfolio: {p.portfolio.toFixed(1)}
      </div>
      {p.ideal != null && (
        <div className="tnum text-amber-300">Ideal: {p.ideal.toFixed(1)}</div>
      )}
      {p.nifty != null && (
        <div className="tnum text-slate-300">Nifty 50: {p.nifty.toFixed(1)}</div>
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-80 w-full rounded-md bg-slate-900" />;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={(d: string) => d.slice(0, 4)}
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
            minTickGap={16}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={40}
            domain={["auto", "auto"]}
          />
          <ReferenceLine y={100} stroke="#475569" strokeDasharray="4 4" />
          <Tooltip content={<TooltipBox accent={accent} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8" }}
            iconType="plainline"
          />
          <Line
            name="Your portfolio"
            type="monotone"
            dataKey="portfolio"
            stroke={accent}
            strokeWidth={2.6}
            dot={false}
          />
          <Line
            name="Ideal portfolio"
            type="monotone"
            dataKey="ideal"
            stroke="#fbbf24"
            strokeWidth={1.8}
            strokeDasharray="6 4"
            dot={false}
            connectNulls
          />
          {showNifty && (
            <Line
              name="Nifty 50"
              type="monotone"
              dataKey="nifty"
              stroke="#94a3b8"
              strokeWidth={1.4}
              strokeDasharray="1 4"
              strokeLinecap="round"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
