"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SECTOR_ORDER } from "@/lib/stocks";
import { croreCompact, pct, ratio, rupee } from "@/lib/format";

export interface ScreenerRow {
  id: string;
  name: string;
  sector: string;
  price: number | null;
  marketCap: number | null;
  marketCapCategory: "Large" | "Mid" | "Small" | "Micro" | null;
  pe: number | null;
  roe: number | null;
  divYield: number | null;
  de: number | null;
}

// SEBI/NSE bands: Large = Blue, Mid = Purple, Small = Orange, Micro = Red.
const CAT_COLORS: Record<string, string> = {
  Large: "bg-blue-100 text-blue-800",
  Mid: "bg-purple-100 text-purple-800",
  Small: "bg-orange-100 text-orange-800",
  Micro: "bg-red-100 text-red-800",
};

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-gray-50 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <div className="tnum text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

export default function ScreenerGrid({ rows }: { rows: ScreenerRow[] }) {
  const [sector, setSector] = useState("All");
  const [cap, setCap] = useState("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (sector !== "All" && r.sector !== sector) return false;
      if (cap !== "All" && r.marketCapCategory !== cap) return false;
      if (
        query &&
        !r.name.toLowerCase().includes(query) &&
        !r.id.toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [rows, sector, cap, q]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-xs font-medium text-gray-500">
          Sector
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option>All</option>
            {SECTOR_ORDER.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-xs font-medium text-gray-500">
          Market cap
          <select
            value={cap}
            onChange={(e) => setCap(e.target.value)}
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option>All</option>
            <option>Large</option>
            <option>Mid</option>
            <option>Small</option>
            <option>Micro</option>
          </select>
        </label>
        <label className="flex flex-1 flex-col text-xs font-medium text-gray-500">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Company or ticker…"
            className="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-[var(--color-brand)] focus:outline-none"
          />
        </label>
        <div className="pb-2 text-sm text-gray-500">
          {filtered.length} of {rows.length}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/screener/${r.id}`}
            className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900 group-hover:text-[var(--color-brand)]">
                  {r.name}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-mono">{r.id}</span>
                  <span>·</span>
                  <span>{r.sector}</span>
                </div>
              </div>
              {r.marketCapCategory && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    CAT_COLORS[r.marketCapCategory]
                  }`}
                >
                  {r.marketCapCategory}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="tnum text-lg font-bold text-gray-900">
                {rupee(r.price)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-gray-400">
                Jun 2021
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-1.5">
              <MiniStat label="P/E" value={ratio(r.pe, 1)} />
              <MiniStat label="ROE" value={pct(r.roe)} />
              <MiniStat label="Div Yld" value={pct(r.divYield, 2)} />
              <MiniStat label="Mkt Cap" value={croreCompact(r.marketCap)} />
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          No stocks match these filters.
        </div>
      )}
    </div>
  );
}
