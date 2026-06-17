"use client";

import { useMemo, useState, useTransition } from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { rupee, pct, pctSigned, num } from "@/lib/format";
import type { PortfolioResult } from "@/lib/calc";
import { runSimulation } from "./actions";
import PerfChart from "./PerfChart";

interface StockOpt {
  id: string;
  name: string;
}
interface Slot {
  id: string;
  qty: string;
}

const SLOT_COUNT = 5;
const EMPTY_SLOTS: Slot[] = Array.from({ length: SLOT_COUNT }, () => ({ id: "", qty: "" }));

const RATING_LABEL = (r: number): string =>
  r <= 2 ? "Poor" : r <= 4 ? "Below par" : r <= 6 ? "Decent" : r <= 8 ? "Strong" : "Excellent";

export default function Simulator({
  stocks,
  entryPrices,
}: {
  stocks: StockOpt[];
  entryPrices: Record<string, number>;
}) {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [slots, setSlots] = useState<Slot[]>(EMPTY_SLOTS);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const scenario = SCENARIOS.find((s) => s.id === scenarioId)!;

  const entryCost = useMemo(() => {
    return slots.reduce((sum, s) => {
      const q = parseInt(s.qty, 10);
      const p = entryPrices[s.id];
      return sum + (s.id && q > 0 && p ? q * p : 0);
    }, 0);
  }, [slots, entryPrices]);

  const budgetPct = Math.min(100, (entryCost / scenario.capex) * 100);
  const overBudget = entryCost > scenario.capex;

  function setSlot(i: number, patch: Partial<Slot>) {
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
    setResult(null);
  }

  function reset() {
    setSlots(EMPTY_SLOTS);
    setResult(null);
    setError(null);
  }

  // Host convenience: load this scenario's model "ideal 5", auto-sized to capex.
  function loadIdeal() {
    const per = scenario.capex / scenario.ideal.length;
    const next: Slot[] = scenario.ideal.map((id) => {
      const p = entryPrices[id];
      const qty = p ? Math.max(1, Math.floor(per / p)) : 1;
      return { id, qty: String(qty) };
    });
    setSlots(next.concat(EMPTY_SLOTS).slice(0, SLOT_COUNT));
    setResult(null);
  }

  function submit() {
    setError(null);
    const holdings = slots
      .filter((s) => s.id && parseInt(s.qty, 10) > 0)
      .map((s) => ({ id: s.id, qty: parseInt(s.qty, 10) }));
    startTransition(async () => {
      const res = await runSimulation(holdings);
      if ("error" in res) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
        setTimeout(
          () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      }
    });
  }

  const nameOf = (id: string) => stocks.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="space-y-6">
      {/* Scenario */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Scenario
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <select
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value);
              setResult(null);
            }}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none"
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span
            className="rounded-full px-3 py-1 text-sm font-semibold text-white"
            style={{ backgroundColor: scenario.accent }}
          >
            Capex {scenario.capexLabel}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-400">{scenario.description}</p>

        <details className="mt-3 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-slate-400">
            Model &ldquo;ideal 5&rdquo; for this scenario · host reference
          </summary>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {scenario.ideal.map((id) => (
              <span
                key={id}
                className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
              >
                {nameOf(id)}
              </span>
            ))}
            <button
              onClick={loadIdeal}
              className="ml-1 rounded-md border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Load these 5 (auto-sized to capex)
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            Reference only — students never see this; the screener never flags
            good vs. weak stocks.
          </p>
        </details>
      </section>

      {/* Portfolio entry */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">Portfolio (up to 5 stocks)</h2>
          <button
            onClick={reset}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Clear all
          </button>
        </div>

        <div className="space-y-2">
          {slots.map((slot, i) => {
            const q = parseInt(slot.qty, 10);
            const p = entryPrices[slot.id];
            const cost = slot.id && q > 0 && p ? q * p : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-5 text-right text-xs text-slate-500">{i + 1}</span>
                <select
                  value={slot.id}
                  onChange={(e) => setSlot(i, { id: e.target.value })}
                  className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-sm text-slate-100 focus:outline-none"
                >
                  <option value="">— select stock —</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  value={slot.qty}
                  onChange={(e) => setSlot(i, { qty: e.target.value })}
                  placeholder="Qty"
                  className="w-20 rounded-md border border-slate-700 bg-slate-800 px-2 py-2 text-right text-sm text-slate-100 focus:outline-none"
                />
                <span className="tnum hidden w-28 text-right text-xs text-slate-400 sm:block">
                  {slot.id && p ? rupee(p) : ""}
                </span>
                <span className="tnum w-28 text-right text-sm text-slate-300">
                  {cost ? rupee(cost) : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Budget bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Entry cost{" "}
              <span className="tnum font-semibold text-slate-100">
                {rupee(entryCost)}
              </span>{" "}
              of {scenario.capexLabel}
            </span>
            <span
              className={overBudget ? "font-semibold text-red-400" : "text-slate-400"}
            >
              {overBudget
                ? `Over budget by ${rupee(entryCost - scenario.capex)}`
                : `${rupee(scenario.capex - entryCost)} left`}
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${budgetPct}%`,
                backgroundColor: overBudget ? "#ef4444" : scenario.accent,
              }}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={submit}
            disabled={pending}
            className="rounded-md bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {pending ? "Running…" : "Run simulation →"}
          </button>
          <span className="text-xs text-slate-500">
            Reveals June 2021 → June 2026 performance
          </span>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section id="results" className="space-y-6 scroll-mt-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat
              label="Total return"
              value={pctSigned(result.totalReturn)}
              positive={result.totalReturn >= 0}
              big
            />
            <Stat label="Entry value (Jun 2021)" value={rupee(result.entryValue)} />
            <Stat label="Exit value (Jun 2026)" value={rupee(result.exitValue)} />
            <RatingCard rating={result.rating} accent={scenario.accent} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-1 flex items-baseline justify-between">
              <h2 className="font-semibold text-slate-100">
                Indexed performance (100 = June 2021)
              </h2>
              <span className="text-xs text-slate-500">vs Nifty 50</span>
            </div>
            <p className="mb-3 text-xs text-slate-500">
              Performance is measured as % growth indexed to 100, so scenarios
              with different capex can be compared fairly.
            </p>
            <PerfChart data={result.timeline} accent={scenario.accent} />
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="mb-3 font-semibold text-slate-100">Holdings breakdown</h2>
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-right text-xs text-slate-500">
                    <th className="py-2 text-left font-medium">Stock</th>
                    <th className="px-2 py-2 font-medium">Qty</th>
                    <th className="px-2 py-2 font-medium">Entry (Jun 21)</th>
                    <th className="px-2 py-2 font-medium">Exit (Jun 26)</th>
                    <th className="px-2 py-2 font-medium">Return</th>
                    <th className="px-2 py-2 font-medium">Weight</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {result.holdings.map((h) => (
                    <tr key={h.id} className="border-b border-slate-800/70 text-right">
                      <td className="py-2 text-left text-slate-200">
                        {nameOf(h.id)}{" "}
                        <span className="font-mono text-xs text-slate-500">{h.id}</span>
                      </td>
                      <td className="px-2 py-2 text-slate-300">{num(h.qty, 0)}</td>
                      <td className="px-2 py-2 text-slate-300">{rupee(h.entry)}</td>
                      <td className="px-2 py-2 text-slate-300">{rupee(h.exit)}</td>
                      <td
                        className={`px-2 py-2 font-semibold ${
                          (h.stockReturn ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {pctSigned(h.stockReturn)}
                      </td>
                      <td className="px-2 py-2 text-slate-400">{pct(h.weight)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
  big,
}: {
  label: string;
  value: string;
  positive?: boolean;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className={`tnum mt-1 font-bold ${big ? "text-2xl" : "text-lg"} ${
          positive === undefined
            ? "text-slate-100"
            : positive
              ? "text-emerald-400"
              : "text-red-400"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RatingCard({ rating, accent }: { rating: number; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">Rating</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="tnum text-2xl font-bold" style={{ color: accent }}>
          {rating}
        </span>
        <span className="text-sm text-slate-500">/10</span>
      </div>
      <div className="mt-1.5 flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i < rating ? accent : "#1e293b" }}
          />
        ))}
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{RATING_LABEL(rating)}</div>
    </div>
  );
}
