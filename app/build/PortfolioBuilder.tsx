"use client";

/**
 * Portfolio builder - step 3 of the guided flow.
 *
 * Laid out as a trading terminal rather than a form: a scrollable universe
 * blotter on the left, the portfolio on the right, and a status strip across
 * the top carrying the mandate and the money. All of it is built from the same
 * ink surfaces, hairlines and JetBrains Mono figures as the screener, so the
 * density reads as Bloomberg without introducing a second visual language.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { animate, stagger } from "animejs";
import { SCENARIOS } from "@/lib/scenarios";
import {
  recallPortfolio,
  recallScenario,
  rememberPortfolio,
  type DraftHolding,
} from "@/lib/game";
import { rupee, pct } from "@/lib/format";
import { SECTOR_ORDER } from "@/lib/stocks";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconSearch, IconUsers } from "../components/Icons";
import { useMounted } from "../components/useMounted";

export interface BuilderStock {
  id: string;
  name: string;
  sector: string;
  price: number | null;
  cap: "Large" | "Mid" | "Small" | "Micro" | null;
}

interface Position {
  id: string;
  qty: number;
}

const CAP_STYLE: Record<string, string> = {
  Large: "border-accent/30 bg-accent/10 text-accent",
  Mid: "border-[#8b7cf6]/30 bg-[#8b7cf6]/10 text-[#a996ff]",
  Small: "border-warn/30 bg-warn/10 text-warn",
  Micro: "border-neg/30 bg-neg/10 text-neg",
};

export default function PortfolioBuilder({
  stocks,
}: {
  stocks: BuilderStock[];
}) {
  // Seeding state from sessionStorage has to wait for the client, or the
  // prerendered HTML (which has no storage) disagrees with the first client
  // render. Holding the skeleton until mount keeps hydration clean.
  const mounted = useMounted();
  if (!mounted) return <BuilderSkeleton />;
  return <Builder stocks={stocks} />;
}

/** Reserves the page's shape so the swap-in causes no layout shift. */
function BuilderSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-5 h-[188px] rounded-xl border border-line bg-ink-850/60" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-[560px] rounded-xl border border-line bg-ink-850/40" />
        <div className="h-[320px] rounded-xl border border-line bg-ink-850/40" />
      </div>
    </div>
  );
}

function Builder({ stocks }: { stocks: BuilderStock[] }) {
  const router = useRouter();
  const paramScenario = useSearchParams().get("scenario");

  // Resolved at first render, not in an effect: the query param wins, then
  // whatever the randomiser stored. `useSearchParams` inside a Suspense
  // boundary makes Next render this subtree on the client only, so reading
  // sessionStorage here cannot desync from prerendered HTML. (recallScenario
  // swallows the server-side ReferenceError and returns null.)
  const [assignedId] = useState<string | null>(() => {
    const wanted = paramScenario ?? recallScenario();
    return wanted && SCENARIOS.some((s) => s.id === wanted) ? wanted : null;
  });
  // Anything else is a standalone visit, where the scenario becomes a normal
  // picker instead of a fixed assignment.
  const [pickedId, setPickedId] = useState(() => assignedId ?? SCENARIOS[0].id);
  // Coming back from the simulator should not wipe the draft.
  const [positions, setPositions] = useState<Position[]>(() =>
    recallPortfolio().map((h) => ({ id: h.id, qty: h.qty })),
  );
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");

  const ticketRef = useRef<HTMLDivElement | null>(null);
  const totalRef = useRef<HTMLSpanElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const justAdded = useRef<string | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  const scenario =
    SCENARIOS.find((s) => s.id === (assignedId ?? pickedId)) ?? SCENARIOS[0];
  const budget = scenario.capex;

  const priceOf = useCallback(
    (id: string) => stocks.find((s) => s.id === id)?.price ?? null,
    [stocks],
  );
  const metaOf = useCallback(
    (id: string) => stocks.find((s) => s.id === id),
    [stocks],
  );

  const costOf = useCallback(
    (p: Position) => {
      const price = priceOf(p.id);
      return price != null ? price * p.qty : 0;
    },
    [priceOf],
  );

  const used = useMemo(
    () => positions.reduce((sum, p) => sum + costOf(p), 0),
    [positions, costOf],
  );
  const left = budget - used;
  const overBudget = used > budget;
  const usedPct = budget > 0 ? (used / budget) * 100 : 0;
  const filled = positions.filter((p) => p.qty > 0);
  const canProceed = filled.length > 0 && !overBudget;

  /* ---------------- mutations ---------------- */

  function addStock(id: string) {
    setPositions((prev) => {
      if (prev.some((p) => p.id === id)) return prev;
      justAdded.current = id;
      // Always start at a single share. The player sets the size themselves
      // from the portfolio panel; guessing a quantity for them just means
      // they have to undo it.
      return [...prev, { id, qty: 1 }];
    });
  }

  function setQty(id: string, qty: number) {
    setPositions((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.max(0, Math.min(999999, qty)) } : p,
      ),
    );
  }

  function removeStock(id: string) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }

  /** Top up a holding with whatever budget is still unallocated. */
  function maxOut(id: string) {
    const price = priceOf(id);
    if (!price) return;
    const others = positions
      .filter((p) => p.id !== id)
      .reduce((sum, p) => sum + costOf(p), 0);
    const affordable = Math.floor(Math.max(0, budget - others) / price);
    setQty(id, affordable);
  }

  function clearAll() {
    setPositions([]);
  }

  function proceed() {
    if (!canProceed) return;
    const holdings: DraftHolding[] = filled.map((p) => ({
      id: p.id,
      qty: p.qty,
    }));
    rememberPortfolio(holdings);
    router.push(`/simulator?scenario=${scenario.id}`);
  }

  /* ---------------- animation ---------------- */

  // Flash the row that was just bought so the eye follows it across.
  useEffect(() => {
    const id = justAdded.current;
    if (!id || reduced.current) {
      justAdded.current = null;
      return;
    }
    justAdded.current = null;
    const row = ticketRef.current?.querySelector(`[data-pos="${id}"]`);
    if (!row) return;
    const anim = animate(row, {
      opacity: [0, 1],
      translateX: [12, 0],
      backgroundColor: ["rgba(77,141,255,0.16)", "rgba(77,141,255,0)"],
      duration: 520,
      ease: "outQuad",
    });
    return () => {
      anim.pause();
    };
  }, [positions]);

  // Tween the headline total and the budget bar rather than snapping them.
  const prevUsed = useRef(0);
  useEffect(() => {
    const el = totalRef.current;
    if (!el) return;
    if (reduced.current) {
      el.textContent = rupee(used);
      prevUsed.current = used;
      return;
    }
    const proxy = { v: prevUsed.current };
    const anim = animate(proxy, {
      v: used,
      duration: 460,
      ease: "outQuad",
      onUpdate: () => {
        el.textContent = rupee(proxy.v);
      },
    });
    prevUsed.current = used;
    return () => {
      anim.pause();
    };
  }, [used]);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || reduced.current) return;
    const anim = animate(bar, {
      width: `${Math.min(100, usedPct)}%`,
      duration: 460,
      ease: "outQuad",
    });
    return () => {
      anim.pause();
    };
  }, [usedPct]);

  // Stagger a restored draft in on first paint only - later additions get the
  // single-row flash above instead.
  useEffect(() => {
    if (reduced.current) return;
    const rows = ticketRef.current?.querySelectorAll("[data-pos]");
    if (!rows?.length) return;
    const anim = animate(rows, {
      opacity: [0, 1],
      translateY: [8, 0],
      delay: stagger(60),
      duration: 380,
      ease: "outQuad",
    });
    return () => {
      anim.pause();
    };
  }, []);

  /* ---------------- universe list ---------------- */

  const universe = useMemo(() => {
    const q = query.trim().toLowerCase();
    return stocks.filter((s) => {
      if (sector !== "All" && s.sector !== sector) return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [stocks, query, sector]);

  const held = new Set(positions.map((p) => p.id));
  // No position cap: the capital budget is the only constraint.

  return (
    <div>
      {/* ---------- Status strip ---------- */}
      <div className="mb-5 overflow-hidden rounded-xl border border-line bg-ink-850">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-5 py-3">
          <Link
            href={
              assignedId ? `/screener?scenario=${assignedId}` : "/screener"
            }
            className="group flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
          >
            <IconArrowRight className="h-4 w-4 rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Screener
          </Link>

          <span aria-hidden className="h-4 w-px bg-line-strong" />

          <p className="eyebrow">
            Step 3 · Build
          </p>

          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                overBudget ? "bg-neg" : filled.length ? "bg-pos" : "bg-fg-dim",
              )}
            />
            <span className="tnum uppercase tracking-wider text-fg-dim">
              {filled.length} {filled.length === 1 ? "position" : "positions"}
            </span>
          </div>
        </div>

        {/* Terminal-style readout: mandate on the left, money on the right. */}
        <div className="grid gap-px bg-line md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <div className="flex items-center gap-3 bg-ink-850 px-5 py-4">
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border"
              style={{
                borderColor: `${scenario.accent}55`,
                backgroundColor: `${scenario.accent}1a`,
                color: scenario.accent,
              }}
            >
              <IconUsers className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-fg-dim">
                {assignedId ? "Assigned mandate" : "Mandate"}
              </p>
              <p className="mt-0.5 truncate text-[15px] font-semibold text-fg">
                {scenario.name}
              </p>
            </div>
          </div>

          <Readout label="Capital" value={rupee(budget)} />
          <Readout
            label="Deployed"
            valueRef={totalRef}
            value={rupee(used)}
            tone={overBudget ? "neg" : used > 0 ? "accent" : undefined}
          />
          <Readout
            label={overBudget ? "Over by" : "Uncommitted"}
            value={rupee(Math.abs(left))}
            tone={overBudget ? "neg" : "pos"}
          />
        </div>

        {/* Budget bar */}
        <div className="border-t border-line px-5 py-3">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-ink-800"
            role="progressbar"
            aria-label="Capital deployed"
            aria-valuenow={Math.round(usedPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              ref={barRef}
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, usedPct)}%`,
                backgroundColor: overBudget ? "#f1566a" : scenario.accent,
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="tnum text-fg-dim">
              {pct(Math.min(100, usedPct), 1)} deployed
            </span>
            {!assignedId && (
              <span className="text-fg-dim">
                No assignment —{" "}
                <Link
                  href="/play"
                  className="text-accent transition-colors duration-200 hover:text-[#7db0ff]"
                >
                  draw an investor
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Standalone visitors pick their own mandate. */}
      {!assignedId && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-ink-900 px-4 py-3">
          <span className="text-[11px] uppercase tracking-wider text-fg-dim">
            Budget profile
          </span>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setPickedId(s.id)}
              aria-pressed={s.id === pickedId}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200",
                s.id === pickedId
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-line-strong bg-ink-850 text-fg-muted hover:border-fg-dim hover:text-fg",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ---------- Universe blotter ---------- */}
        <section className="overflow-hidden rounded-xl border border-line bg-ink-850/50">
          <div className="border-b border-line p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-0 flex-1">
                <label htmlFor="builder-search" className="sr-only">
                  Search company or ticker
                </label>
                <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-dim" />
                <input
                  id="builder-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search company or ticker"
                  className="w-full rounded-lg border border-line-strong bg-ink-900 py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
                />
              </div>
              <span className="tnum text-xs text-fg-dim">
                {universe.length} / {stocks.length}
              </span>
            </div>

            <div className="thin-scroll mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
              {["All", ...SECTOR_ORDER].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  aria-pressed={sector === s}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200",
                    sector === s
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-line-strong bg-ink-850 text-fg-muted hover:border-fg-dim hover:text-fg",
                  )}
                >
                  {s === "All" ? "All sectors" : s}
                </button>
              ))}
            </div>
          </div>

          <div className="thin-scroll max-h-[560px] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">
                Stock universe. Buy any row to add it to your portfolio.
              </caption>
              <thead className="sticky top-0 z-10 bg-ink-850">
                <tr className="border-b border-line text-[10px] uppercase tracking-wider text-fg-dim">
                  <th scope="col" className="px-4 py-2.5 text-left font-medium">
                    Ticker
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">
                    Jun-21 close
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    <span className="sr-only">Buy</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {universe.map((s) => {
                  const isHeld = held.has(s.id);
                  const disabled = isHeld;
                  return (
                    <tr
                      key={s.id}
                      className="group border-b border-line/60 transition-colors duration-150 last:border-b-0 hover:bg-ink-850"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="tnum text-[13px] font-semibold text-fg">
                            {s.id}
                          </span>
                          {s.cap && (
                            <span
                              className={cn(
                                "rounded border px-1.5 py-px text-[10px] font-medium",
                                CAP_STYLE[s.cap],
                              )}
                            >
                              {s.cap}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-fg-dim">
                          {s.name} · {s.sector}
                        </div>
                      </td>
                      <td className="tnum whitespace-nowrap px-3 py-2.5 text-right text-[13px] text-fg-muted">
                        {rupee(s.price)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => addStock(s.id)}
                          disabled={disabled}
                          title={
                            isHeld ? "Already in your portfolio" : `Buy ${s.id}`
                          }
                          className={cn(
                            "rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200",
                            isHeld
                              ? "cursor-default border-pos/30 bg-pos/10 text-pos"
                              : "cursor-pointer border-line-strong text-fg-muted hover:border-accent hover:bg-accent/10 hover:text-accent",
                          )}
                        >
                          {isHeld ? "Held" : "Buy"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {universe.length === 0 && (
              <p className="px-6 py-14 text-center text-sm text-fg-muted">
                No companies match those filters.
              </p>
            )}
          </div>
        </section>

        {/* ---------- Order ticket ---------- */}
        <section className="lg:sticky lg:top-20 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-line bg-ink-850/50">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-fg">
                Your portfolio
              </h2>
              {positions.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="cursor-pointer text-xs font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
                >
                  Clear
                </button>
              )}
            </div>

            <div ref={ticketRef}>
              {positions.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <p className="text-sm text-fg-muted">No positions yet.</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-dim">
                    Buy any stocks you like from the universe - the budget
                    is the only limit.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {positions.map((p) => {
                    const meta = metaOf(p.id);
                    const cost = costOf(p);
                    const weight = used > 0 ? (cost / used) * 100 : 0;
                    return (
                      <li key={p.id} data-pos={p.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="tnum text-[13px] font-semibold text-fg">
                              {p.id}
                            </span>
                            <p className="mt-0.5 truncate text-[11px] text-fg-dim">
                              {meta?.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeStock(p.id)}
                            aria-label={`Remove ${p.id}`}
                            className="cursor-pointer rounded p-1 text-fg-dim transition-colors duration-200 hover:text-neg"
                          >
                            <svg
                              viewBox="0 0 16 16"
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              strokeLinecap="round"
                              aria-hidden
                            >
                              <path d="M4 4l8 8M12 4l-8 8" />
                            </svg>
                          </button>
                        </div>

                        <div className="mt-2.5 flex items-center gap-1.5">
                          <Stepper
                            label={`Decrease ${p.id}`}
                            onClick={() => setQty(p.id, p.qty - 1)}
                            disabled={p.qty <= 0}
                          >
                            −
                          </Stepper>
                          <label className="sr-only" htmlFor={`qty-${p.id}`}>
                            Quantity for {p.id}
                          </label>
                          <input
                            id={`qty-${p.id}`}
                            type="number"
                            min={0}
                            value={p.qty}
                            onChange={(e) =>
                              setQty(p.id, Math.floor(Number(e.target.value)))
                            }
                            className="tnum w-full min-w-0 rounded-md border border-line-strong bg-ink-900 px-2 py-1.5 text-right text-[13px] text-fg focus:border-accent focus:outline-none"
                          />
                          <Stepper
                            label={`Increase ${p.id}`}
                            onClick={() => setQty(p.id, p.qty + 1)}
                          >
                            +
                          </Stepper>
                          <button
                            type="button"
                            onClick={() => maxOut(p.id)}
                            title="Fill with the remaining budget"
                            className="cursor-pointer rounded-md border border-line-strong px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent"
                          >
                            Max
                          </button>
                        </div>

                        <dl className="mt-2 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <dt className="text-fg-dim">@</dt>
                            <dd className="tnum text-fg-muted">
                              {rupee(meta?.price ?? null)}
                            </dd>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <dt className="sr-only">Weight</dt>
                              <dd className="tnum text-fg-dim">
                                {pct(weight, 1)}
                              </dd>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <dt className="sr-only">Cost</dt>
                              <dd className="tnum font-semibold text-fg">
                                {rupee(cost)}
                              </dd>
                            </div>
                          </div>
                        </dl>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer: totals + proceed */}
            <div className="border-t border-line bg-ink-900/60 px-4 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-wider text-fg-dim">
                  Total cost
                </span>
                <span
                  className={cn(
                    "tnum text-[17px] font-semibold",
                    overBudget ? "text-neg" : "text-fg",
                  )}
                >
                  {rupee(used)}
                </span>
              </div>

              {overBudget && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg border border-neg/25 bg-neg/[0.07] px-3 py-2 text-[11px] leading-relaxed text-neg"
                >
                  Over the {rupee(budget)} mandate by {rupee(used - budget)}.
                  Trim a position to continue.
                </p>
              )}

              <button
                type="button"
                onClick={proceed}
                disabled={!canProceed}
                className={cn(
                  "group mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors duration-200",
                  canProceed
                    ? "cursor-pointer bg-accent text-ink-950 hover:bg-[#6ba0ff]"
                    : "cursor-not-allowed bg-ink-800 text-fg-dim",
                )}
              >
                See how it performed
                <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>

              <p className="mt-2.5 text-center text-[11px] text-fg-dim">
                {filled.length === 0
                  ? "Place a buy order to build your portfolio"
                  : "Reveals June 2021 → June 2026 performance"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- small parts ---------------- */

function Readout({
  label,
  value,
  valueRef,
  tone,
}: {
  label: string;
  value: string;
  valueRef?: React.Ref<HTMLSpanElement>;
  tone?: "pos" | "neg" | "accent";
}) {
  const toneClass =
    tone === "neg"
      ? "text-neg"
      : tone === "pos"
        ? "text-pos"
        : tone === "accent"
          ? "text-accent"
          : "text-fg";
  return (
    <div className="bg-ink-850 px-5 py-4">
      <p className="text-[10px] uppercase tracking-wider text-fg-dim">{label}</p>
      <span
        ref={valueRef}
        className={cn("tnum mt-0.5 block text-[15px] font-semibold", toneClass)}
      >
        {value}
      </span>
    </div>
  );
}

function Stepper({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-[30px] w-7 shrink-0 cursor-pointer place-items-center rounded-md border border-line-strong text-fg-muted transition-colors duration-200 hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:text-fg-muted"
    >
      {children}
    </button>
  );
}
