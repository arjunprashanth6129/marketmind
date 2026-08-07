"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { animate, stagger } from "animejs";
import { SCENARIOS } from "@/lib/scenarios";
import { recallPortfolio, recallScenario } from "@/lib/game";
import { rupee, pct, pctSigned, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PortfolioResult } from "@/lib/calc";
import { runSimulation } from "./actions";
import PerfPanel from "./PerfPanel";
import { IconArrowRight } from "../components/Icons";
import { useMounted } from "../components/useMounted";

interface StockOpt {
  id: string;
  name: string;
}
interface Slot {
  id: string;
  qty: string;
}

// A starting number of blank rows, not a limit - rows can be added, and a
// draft from the builder brings across as many holdings as it contains.
const START_SLOTS = 5;
const EMPTY_SLOTS: Slot[] = Array.from({ length: START_SLOTS }, () => ({ id: "", qty: "" }));

const SCORE_LABEL = (r: number): string =>
  r <= 2 ? "Poor" : r <= 4 ? "Below par" : r <= 6 ? "Decent" : r <= 8 ? "Strong" : "Excellent";

/** Shared panel shell, matching the screener's detail panels. */
function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-line bg-ink-850/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function Simulator({
  stocks,
  entryPrices,
}: {
  stocks: StockOpt[];
  entryPrices: Record<string, number>;
}) {
  // Both the scenario and the drafted portfolio come from sessionStorage,
  // which the prerendered HTML cannot see. Waiting for mount keeps the first
  // client render identical to the server's and avoids a hydration mismatch.
  const mounted = useMounted();
  if (!mounted) {
    return <div aria-hidden className="h-[520px] rounded-xl border border-line bg-ink-850/40" />;
  }
  return <SimulatorInner stocks={stocks} entryPrices={entryPrices} />;
}

function SimulatorInner({
  stocks,
  entryPrices,
}: {
  stocks: StockOpt[];
  entryPrices: Record<string, number>;
}) {
  // Pre-select the scenario assigned by /play. The query param survives a
  // shared link; sessionStorage covers the round trip through the login gate,
  // which drops the query string.
  const paramScenario = useSearchParams().get("scenario");
  const [scenarioId, setScenarioId] = useState(() => {
    const wanted = paramScenario ?? recallScenario();
    return SCENARIOS.some((s) => s.id === wanted)
      ? (wanted as string)
      : SCENARIOS[0].id;
  });
  // The draft handed over by /build. Its presence is what tells us the
  // portfolio was already assembled on the previous screen.
  const [draft] = useState(() => recallPortfolio());
  const fromBuilder = draft.length > 0;

  const [slots, setSlots] = useState<Slot[]>(() => {
    if (!draft.length) return EMPTY_SLOTS;
    // Take every drafted holding, then pad with blanks so there is always a
    // free row to type into.
    const filled: Slot[] = draft.map((h) => ({
      id: h.id,
      qty: String(h.qty),
    }));
    while (filled.length < START_SLOTS) filled.push({ id: "", qty: "" });
    return filled;
  });
  // Arriving from the builder should land on the performance, so the editor
  // starts collapsed behind a toggle rather than standing between the player
  // and their result.
  const [showEditor, setShowEditor] = useState(!fromBuilder);
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

  function addSlot() {
    setSlots((prev) => [...prev, { id: "", qty: "" }]);
  }

  function reset() {
    setSlots(EMPTY_SLOTS);
    setResult(null);
    setError(null);
  }

  function submit({ scroll = true }: { scroll?: boolean } = {}) {
    setError(null);
    const holdings = slots
      .filter((s) => s.id && parseInt(s.qty, 10) > 0)
      .map((s) => ({ id: s.id, qty: parseInt(s.qty, 10) }));
    startTransition(async () => {
      const res = await runSimulation(scenarioId, holdings);
      if ("error" in res) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
        if (!scroll) return;
        setTimeout(
          () => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }),
          50,
        );
      }
    });
  }

  const nameOf = (id: string) => stocks.find((s) => s.id === id)?.name ?? id;

  // The portfolio was already assembled and confirmed in the builder, so run
  // it on arrival instead of making the player press submit on a form they
  // have effectively already filled in. No scroll: the result renders first.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !fromBuilder) return;
    autoRan.current = true;
    submit({ scroll: false });
    // Fires once on mount; submit closes over the prefilled slots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stagger the result panels in so the reveal reads as one motion rather than
  // a block of content appearing at once.
  const resultsRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!result || !resultsRef.current) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const panels = resultsRef.current.querySelectorAll(":scope > *");
    if (!panels.length) return;
    const anim = animate(panels, {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(90),
      duration: 480,
      ease: "outQuad",
    });
    return () => {
      anim.pause();
    };
  }, [result]);

  return (
    // Flex + order rather than two branches of JSX: arriving from the builder
    // puts the result first and the editor after it, without duplicating the
    // whole panel tree.
    <div className="flex flex-col gap-6">
      {fromBuilder && (
        <div className="order-1 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-ink-850/50 px-5 py-3.5">
          <p className="text-[13px] text-fg-muted">
            {pending && !result
              ? "Running your portfolio…"
              : error
                ? "Couldn't run your portfolio."
                : "Performance of the portfolio you built."}
          </p>
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            aria-expanded={showEditor}
            className="cursor-pointer rounded-md border border-line-strong px-3 py-1.5 text-[12px] font-medium text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            {showEditor ? "Hide editor" : "Adjust portfolio"}
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-6",
          fromBuilder ? "order-3" : "order-1",
          fromBuilder && !showEditor && "hidden",
        )}
      >
        {/* ---- Scenario ---- */}
        <Panel title="Choose a scenario">
        <div
          role="radiogroup"
          aria-label="Investor scenario"
          className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5"
        >
          {SCENARIOS.map((s) => {
            const active = s.id === scenarioId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  setScenarioId(s.id);
                  setResult(null);
                }}
                className={`cursor-pointer rounded-lg border p-3.5 text-left transition-colors duration-200 ${
                  active
                    ? "border-accent bg-accent/[0.08]"
                    : "border-line bg-ink-900 hover:border-line-strong hover:bg-ink-800"
                }`}
              >
                <div className="text-[13px] font-semibold text-fg">{s.name}</div>
                <span
                  className="mt-2 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    color: s.accent,
                    borderColor: `${s.accent}55`,
                    backgroundColor: `${s.accent}1a`,
                  }}
                >
                  {s.risk}
                </span>
                <div className="tnum mt-2 text-[11px] text-fg-dim">
                  {s.capexLabel}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-fg-muted">
          {scenario.description}
        </p>
      </Panel>

      {/* ---- Portfolio entry ---- */}
      <Panel
        title="Portfolio"
        action={
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer text-xs font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            Clear all
          </button>
        }
      >
        {/* Column headers keep the rows legible without repeating labels. */}
        <div className="hidden grid-cols-[1.5rem_1fr_5rem_7rem_7rem] items-center gap-2 pb-2 text-[10px] uppercase tracking-wider text-fg-dim sm:grid">
          <span />
          <span>Stock</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Entry price</span>
          <span className="text-right">Cost</span>
        </div>

        <div className="space-y-2">
          {slots.map((slot, i) => {
            const q = parseInt(slot.qty, 10);
            const p = entryPrices[slot.id];
            const cost = slot.id && q > 0 && p ? q * p : 0;
            return (
              <div
                key={i}
                className="grid grid-cols-[1.5rem_1fr_5rem] items-center gap-2 sm:grid-cols-[1.5rem_1fr_5rem_7rem_7rem]"
              >
                <span className="tnum text-xs text-fg-dim">{i + 1}</span>

                <label className="sr-only" htmlFor={`slot-${i}-stock`}>
                  Stock for holding {i + 1}
                </label>
                <select
                  id={`slot-${i}-stock`}
                  value={slot.id}
                  onChange={(e) => setSlot(i, { id: e.target.value })}
                  className="min-w-0 cursor-pointer rounded-lg border border-line-strong bg-ink-900 px-2.5 py-2 text-sm text-fg focus:border-accent focus:outline-none"
                >
                  <option value="">— select stock —</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>

                <label className="sr-only" htmlFor={`slot-${i}-qty`}>
                  Quantity for holding {i + 1}
                </label>
                <input
                  id={`slot-${i}-qty`}
                  type="number"
                  min={0}
                  value={slot.qty}
                  onChange={(e) => setSlot(i, { qty: e.target.value })}
                  placeholder="Qty"
                  className="tnum w-full rounded-lg border border-line-strong bg-ink-900 px-2.5 py-2 text-right text-sm text-fg placeholder:font-sans placeholder:text-fg-dim focus:border-accent focus:outline-none"
                />

                <span className="tnum hidden text-right text-[13px] text-fg-dim sm:block">
                  {slot.id && p ? rupee(p) : "—"}
                </span>
                <span className="tnum hidden text-right text-[13px] font-medium text-fg sm:block">
                  {cost ? rupee(cost) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addSlot}
          className="mt-3 cursor-pointer rounded-lg border border-dashed border-line-strong px-3 py-2 text-[12px] font-medium text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
        >
          + Add stock
        </button>

        {/* Budget meter */}
        <div className="mt-5 border-t border-line pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
            <span className="text-fg-muted">
              Entry cost{" "}
              <span className="tnum font-semibold text-fg">
                {rupee(entryCost)}
              </span>{" "}
              of {scenario.capexLabel}
            </span>
            <span
              className={`tnum font-medium ${
                overBudget ? "text-neg" : "text-fg-muted"
              }`}
            >
              {overBudget
                ? `Over budget by ${rupee(entryCost - scenario.capex)}`
                : `${rupee(scenario.capex - entryCost)} left`}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-800"
            role="progressbar"
            aria-label="Budget used"
            aria-valuenow={Math.round(budgetPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{
                width: `${budgetPct}%`,
                backgroundColor: overBudget ? "#f1566a" : scenario.accent,
              }}
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-neg/25 bg-neg/[0.07] px-3.5 py-2.5 text-sm text-neg"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => submit()}
            disabled={pending}
            className="group inline-flex cursor-pointer items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors duration-200 hover:bg-[#6ba0ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Running…" : "Run simulation"}
            {!pending && (
              <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            )}
          </button>
          <span className="text-xs text-fg-dim">
            Reveals June 2021 → June 2026 performance
          </span>
        </div>
        </Panel>
      </div>

      {/* ---- Results ---- */}
      {result && (
        <section
          id="results"
          ref={resultsRef}
          className="order-2 space-y-6 scroll-mt-24"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Total return"
              value={pctSigned(result.totalReturn)}
              positive={result.totalReturn >= 0}
            />
            <Stat label="Entry value · Jun 2021" value={rupee(result.entryValue)} />
            <Stat label="Exit value · Jun 2026" value={rupee(result.exitValue)} />
            <ScoreCard score={result.finalScore} />
          </div>

          {/* Final = Performance×0.5 + Fundamentals×0.5 */}
          <Panel
            title="Score breakdown"
            action={
              <span className="tnum text-xs text-fg-muted">
                Final{" "}
                <span className="font-semibold text-fg">{result.finalScore}</span>
                /10 = Performance×0.5 + Fundamentals×0.5
              </span>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ComponentScore
                label="Performance"
                weight="50%"
                score={result.performanceScore}
                accent={scenario.accent}
                hint={`Your return ${pctSigned(result.totalReturn)} vs Nifty 50 +${result.niftyReturn}%`}
              />
              <ComponentScore
                label="Fundamentals"
                weight="50%"
                score={result.fundamentalScore}
                accent={scenario.accent}
                hint={`June-2021 quality of your picks, weighted for a ${scenario.name.toLowerCase()}`}
              />
            </div>
          </Panel>

          <PerfPanel data={result.timeline} accent={scenario.accent} />

          <Panel title="Holdings breakdown">
            <div className="-mx-5 overflow-x-auto px-5 thin-scroll">
              <table className="w-full min-w-[680px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-right">
                    <th
                      scope="col"
                      className="py-2 text-left text-[10px] font-medium uppercase tracking-wider text-fg-dim"
                    >
                      Stock
                    </th>
                    {[
                      "Qty",
                      "Entry · Jun 21",
                      "Exit · Jun 26",
                      "Return",
                      "Weight",
                      "Fund. score",
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="whitespace-nowrap px-2 py-2 text-[10px] font-medium uppercase tracking-wider text-fg-dim"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.holdings.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b border-line/60 text-right last:border-b-0"
                    >
                      <th scope="row" className="py-2.5 text-left font-normal">
                        <span className="text-fg">{nameOf(h.id)}</span>{" "}
                        <span className="tnum text-xs text-fg-dim">{h.id}</span>
                      </th>
                      <td className="tnum px-2 py-2.5 text-fg-muted">
                        {num(h.qty, 0)}
                      </td>
                      <td className="tnum px-2 py-2.5 text-fg-muted">
                        {rupee(h.entry)}
                      </td>
                      <td className="tnum px-2 py-2.5 text-fg-muted">
                        {rupee(h.exit)}
                      </td>
                      <td
                        className={`tnum px-2 py-2.5 font-semibold ${
                          (h.stockReturn ?? 0) >= 0 ? "text-pos" : "text-neg"
                        }`}
                      >
                        {pctSigned(h.stockReturn)}
                      </td>
                      <td className="tnum px-2 py-2.5 text-fg-dim">
                        {pct(h.weight)}
                      </td>
                      <td
                        className={`tnum px-2 py-2.5 font-semibold ${
                          (h.fundamentalScore ?? 0) === 0
                            ? "text-neg"
                            : (h.fundamentalScore ?? 0) >= 7
                              ? "text-pos"
                              : "text-fg-muted"
                        }`}
                      >
                        {h.fundamentalScore == null
                          ? "—"
                          : `${num(h.fundamentalScore, 1)}/10`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-850/50 p-4">
      <div className="text-[10px] uppercase tracking-wider text-fg-dim">
        {label}
      </div>
      <div
        className={`tnum mt-1.5 text-[22px] font-semibold ${
          positive === undefined ? "text-fg" : positive ? "text-pos" : "text-neg"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function ScoreCard({ score }: { score: number }) {
  // Red at 0 through amber at 5 to green at 10.
  const hue = Math.max(0, Math.min(120, (score / 10) * 120));
  const color = `hsl(${hue} 70% 52%)`;

  // The score is the payoff of the whole exercise, so sweep the dial and count
  // the number up rather than snapping to the result.
  const dialRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(score);

  useEffect(() => {
    const dial = dialRef.current;
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!dial || reduced) {
      setShown(score);
      if (dial) {
        dial.style.background = `conic-gradient(${color} ${(score / 10) * 360}deg, #1e2a40 0deg)`;
      }
      return;
    }
    const proxy = { v: 0 };
    const anim = animate(proxy, {
      v: score,
      duration: 1100,
      ease: "outCubic",
      onUpdate: () => {
        setShown(Math.round(proxy.v * 10) / 10);
        dial.style.background = `conic-gradient(${color} ${(proxy.v / 10) * 360}deg, #1e2a40 0deg)`;
      },
    });
    return () => {
      anim.pause();
    };
  }, [score, color]);

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-ink-850/50 p-4">
      <div
        ref={dialRef}
        className="relative grid h-[68px] w-[68px] shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} 0deg, #1e2a40 0deg)` }}
      >
        <div className="grid h-[54px] w-[54px] place-items-center rounded-full bg-ink-850">
          <span className="tnum text-xl font-semibold" style={{ color }}>
            {shown}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-fg-dim">
          Final score
        </div>
        <div className="mt-1 text-[15px] font-semibold" style={{ color }}>
          {SCORE_LABEL(score)}
        </div>
        <div className="tnum mt-0.5 text-xs text-fg-dim">{score} / 10</div>
      </div>
    </div>
  );
}

function ComponentScore({
  label,
  weight,
  score,
  accent,
  hint,
}: {
  label: string;
  weight: string;
  score: number;
  accent: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-900 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-fg">
          {label}{" "}
          <span className="text-[11px] font-normal text-fg-dim">({weight})</span>
        </span>
        <span className="tnum text-lg font-semibold" style={{ color: accent }}>
          {score}
          <span className="text-xs text-fg-dim">/10</span>
        </span>
      </div>
      <div
        className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-ink-800"
        role="progressbar"
        aria-label={`${label} score`}
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={10}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${(score / 10) * 100}%`, backgroundColor: accent }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-fg-dim">{hint}</p>
    </div>
  );
}
