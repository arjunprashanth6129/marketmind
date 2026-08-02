"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SECTOR_ORDER } from "@/lib/stocks";
import { croreCompact, pct, ratio, rupee } from "@/lib/format";
import { IconSearch } from "../components/Icons";

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

/* Cap-category tint. Muted on purpose: the badge is a label, not a highlight. */
const CAT_STYLE: Record<string, string> = {
  Large: "border-accent/30 bg-accent/10 text-accent",
  Mid: "border-[#8b7cf6]/30 bg-[#8b7cf6]/10 text-[#a996ff]",
  Small: "border-warn/30 bg-warn/10 text-warn",
  Micro: "border-neg/30 bg-neg/10 text-neg",
};

type SortKey = "name" | "marketCap" | "pe" | "roe" | "divYield" | "de";

const COLUMNS: {
  key: SortKey;
  label: string;
  align: "left" | "right";
  hint?: string;
}[] = [
  { key: "name", label: "Company", align: "left" },
  { key: "marketCap", label: "Mkt Cap", align: "right" },
  { key: "pe", label: "P/E", align: "right", hint: "Price to earnings" },
  { key: "roe", label: "ROE", align: "right", hint: "Return on equity, FY2021" },
  { key: "divYield", label: "Div Yld", align: "right" },
  { key: "de", label: "D/E", align: "right", hint: "Debt to equity" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-line-strong bg-ink-850 text-fg-muted hover:border-fg-dim hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

/** Sort arrow. Rendered only on the active column so the header stays quiet. */
function SortMark({ dir }: { dir: "asc" | "desc" }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className="h-3 w-3 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dir === "asc" ? <path d="M6 9V3m0 0L3 6m3-3 3 3" /> : <path d="M6 3v6m0 0 3-3m-3 3-3-3" />}
    </svg>
  );
}

export default function ScreenerGrid({ rows }: { rows: ScreenerRow[] }) {
  // Carry the play-flow scenario into stock links so the assignment banner
  // survives drill-down. Read on the client so the page stays static.
  const scenarioId = useSearchParams().get("scenario");
  const hrefFor = (id: string) =>
    scenarioId
      ? `/screener/${id}?scenario=${encodeURIComponent(scenarioId)}`
      : `/screener/${id}`;
  const [sector, setSector] = useState("All");
  const [cap, setCap] = useState("All");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const out = rows.filter((r) => {
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

    const dir = sortDir === "asc" ? 1 : -1;
    return out.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      // Nulls always sort last, regardless of direction, so "no data" never
      // masquerades as a top or bottom performer.
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av - bv) * dir;
    });
  }, [rows, sector, cap, q, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Names read naturally A-Z; every metric is most useful highest-first.
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const reset = () => {
    setSector("All");
    setCap("All");
    setQ("");
  };
  const isFiltered = sector !== "All" || cap !== "All" || q.trim() !== "";

  return (
    <div>
      {/* ---- Filter bar ---- */}
      <div className="rounded-t-xl border border-line bg-ink-850 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72">
            <label htmlFor="screener-search" className="sr-only">
              Search company or ticker
            </label>
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim" />
            <input
              id="screener-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company or ticker"
              className="w-full rounded-lg border border-line-strong bg-ink-900 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["All", "Large", "Mid", "Small"].map((c) => (
              <Chip key={c} active={cap === c} onClick={() => setCap(c)}>
                {c === "All" ? "All caps" : `${c} cap`}
              </Chip>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3">
            {isFiltered && (
              <button
                type="button"
                onClick={reset}
                className="cursor-pointer text-xs font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
              >
                Clear filters
              </button>
            )}
            <span className="tnum text-xs text-fg-dim">
              {filtered.length} / {rows.length}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
          <Chip active={sector === "All"} onClick={() => setSector("All")}>
            All sectors
          </Chip>
          {SECTOR_ORDER.map((s) => (
            <Chip key={s} active={sector === s} onClick={() => setSector(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>

      {/* ---- Table (sm and up) ---- */}
      <div className="hidden overflow-x-auto border-x border-b border-line sm:block thin-scroll">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <caption className="sr-only">
            {filtered.length} NSE companies with June 2021 fundamentals, sortable
            by market cap, P/E, ROE, dividend yield and debt to equity.
          </caption>
          <thead>
            <tr className="border-b border-line bg-ink-850/60">
              {COLUMNS.map((c) => {
                const active = sortKey === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    title={c.hint}
                    aria-sort={
                      active
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none"
                    }
                    className={`px-4 py-2.5 font-medium ${
                      c.align === "left" ? "text-left" : "text-right"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className={`inline-flex cursor-pointer items-center gap-1.5 text-xs uppercase tracking-wider transition-colors duration-200 hover:text-fg ${
                        active ? "text-fg" : "text-fg-dim"
                      } ${c.align === "right" ? "flex-row-reverse" : ""}`}
                    >
                      {c.label}
                      {active && <SortMark dir={sortDir} />}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="group border-b border-line/70 transition-colors duration-150 last:border-b-0 hover:bg-ink-850"
              >
                <td className="px-4 py-3">
                  <Link href={hrefFor(r.id)} className="block">
                    <span className="font-medium text-fg transition-colors duration-200 group-hover:text-accent">
                      {r.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-fg-dim">
                      <span className="tnum">{r.id}</span>
                      <span aria-hidden>·</span>
                      <span>{r.sector}</span>
                      {r.marketCapCategory && (
                        <span
                          className={`rounded border px-1.5 py-px text-[10px] font-medium ${
                            CAT_STYLE[r.marketCapCategory]
                          }`}
                        >
                          {r.marketCapCategory}
                        </span>
                      )}
                    </span>
                  </Link>
                </td>
                <td className="tnum px-4 py-3 text-right text-fg-muted">
                  {croreCompact(r.marketCap)}
                </td>
                <td className="tnum px-4 py-3 text-right text-fg-muted">
                  {ratio(r.pe, 1)}
                </td>
                <td className="tnum px-4 py-3 text-right font-medium text-fg">
                  {pct(r.roe)}
                </td>
                <td className="tnum px-4 py-3 text-right text-fg-muted">
                  {pct(r.divYield, 2)}
                </td>
                <td className="tnum px-4 py-3 text-right text-fg-muted">
                  {ratio(r.de, 2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Cards (below sm) ---- */}
      <div className="divide-y divide-line border-x border-b border-line sm:hidden">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={hrefFor(r.id)}
            className="block p-4 transition-colors duration-200 active:bg-ink-850"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-fg">{r.name}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-dim">
                  <span className="tnum">{r.id}</span>
                  <span aria-hidden>·</span>
                  <span className="truncate">{r.sector}</span>
                </div>
              </div>
              {r.marketCapCategory && (
                <span
                  className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                    CAT_STYLE[r.marketCapCategory]
                  }`}
                >
                  {r.marketCapCategory}
                </span>
              )}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 xs:grid-cols-4">
              {[
                ["ROE", pct(r.roe)],
                ["P/E", ratio(r.pe, 1)],
                ["Price", rupee(r.price)],
                ["Mkt Cap", croreCompact(r.marketCap)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase tracking-wider text-fg-dim">
                    {label}
                  </dt>
                  <dd className="tnum mt-0.5 truncate text-[13px] font-medium text-fg">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-b-xl border-x border-b border-line bg-ink-900 px-6 py-16 text-center">
          <p className="text-sm text-fg-muted">
            No companies match these filters.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-3 cursor-pointer text-sm font-medium text-accent transition-colors duration-200 hover:text-[#7db0ff]"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
