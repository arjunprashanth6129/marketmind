// Financial calculations shared by the screener (CAGR) and simulator (portfolio).

import {
  ANCHOR_MONTH,
  END_MONTH,
  getSimPrices,
  getNiftySim,
  entryPrice,
  exitPrice,
  type PricePoint,
} from "./data";

// Compounded annual growth rate (%), or null if endpoints missing/invalid.
export function cagr(
  start: number | null | undefined,
  end: number | null | undefined,
  years: number,
): number | null {
  if (start == null || end == null || start <= 0 || end <= 0) return null;
  return ((end / start) ** (1 / years) - 1) * 100;
}

export interface Holding {
  id: string;
  qty: number;
}

export interface HoldingResult {
  id: string;
  qty: number;
  entry: number | null;
  exit: number | null;
  entryValue: number | null;
  exitValue: number | null;
  stockReturn: number | null; // %
  weight: number | null; // % of entry portfolio value
  fundamentalScore: number | null; // 0–10, per-stock June-2021 quality (filled by scoring)
}

export interface TimelinePoint {
  date: string;
  portfolio: number; // indexed to 100 at June 2021
  nifty: number | null; // indexed to 100 at June 2021 (visual reference only)
  ideal: number | null; // ideal portfolio, indexed to 100 (filled by scoring)
}

export interface PortfolioResult {
  holdings: HoldingResult[];
  entryValue: number;
  exitValue: number;
  totalReturn: number; // %
  timeline: TimelinePoint[];
  // Scoring (filled by the server-side scoring layer; 0 in the bare base result).
  idealReturn: number; // scenario ideal-portfolio total return %
  performanceScore: number; // 0–10 (participant return vs ideal portfolio)
  fundamentalScore: number; // 0–10 (avg per-stock fundamental quality)
  finalScore: number; // 0–10 = performance*0.5 + fundamental*0.5
}

// Canonical monthly grid June 2021 – June 2026 (all stocks share it).
// Derived from the Nifty benchmark series, which is always present and is
// never part of the tradeable universe — so the grid survives any stock
// add/removal (avoids the Phase-0 breakage when a referenced ticker like
// TCS was removed). Verified identical to the per-stock monthly grid.
function monthGrid(): string[] {
  return getNiftySim().map((p) => p.date);
}

function priceMap(id: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of getSimPrices(id)) m.set(p.date, p.close);
  return m;
}

// Base (unscored) portfolio computation. Scoring (performance vs the scenario's
// ideal portfolio + per-stock fundamentals) is layered on server-side in
// lib/scoring.ts so the ideal-portfolio data never reaches the client.
export function computePortfolio(holdings: Holding[]): PortfolioResult {
  const clean = holdings.filter((h) => h.id && h.qty > 0);

  const results: HoldingResult[] = clean.map((h) => {
    const entry = entryPrice(h.id);
    const exit = exitPrice(h.id);
    const entryValue = entry != null ? entry * h.qty : null;
    const exitValue = exit != null ? exit * h.qty : null;
    const stockReturn =
      entry != null && exit != null && entry > 0
        ? (exit / entry - 1) * 100
        : null;
    return {
      id: h.id,
      qty: h.qty,
      entry,
      exit,
      entryValue,
      exitValue,
      stockReturn,
      weight: null,
      fundamentalScore: null,
    };
  });

  const entryValue = results.reduce((s, r) => s + (r.entryValue ?? 0), 0);
  const exitValue = results.reduce((s, r) => s + (r.exitValue ?? 0), 0);
  for (const r of results) {
    r.weight =
      entryValue > 0 && r.entryValue != null
        ? (r.entryValue / entryValue) * 100
        : null;
  }

  const totalReturn = entryValue > 0 ? (exitValue / entryValue - 1) * 100 : 0;

  // Timeline: portfolio value at each month, indexed to 100 at the anchor.
  const grid = monthGrid();
  const maps = new Map(clean.map((h) => [h.id, priceMap(h.id)]));
  // For stocks listed after the anchor (PAYTM), back-fill pre-listing months
  // flat at the first available (listing) price so the index has no artificial
  // jump and the base value matches the per-holding entry value.
  const firstClose = new Map(
    clean.map((h) => {
      const sim = getSimPrices(h.id);
      return [h.id, sim.length ? sim[0].close : null];
    }),
  );
  const niftyMap = new Map(getNiftySim().map((p) => [p.date, p.close]));
  const nifty0 = niftyMap.get(ANCHOR_MONTH) ?? null;

  let base = 0;
  const timeline: TimelinePoint[] = [];
  for (const date of grid) {
    let val = 0;
    for (const h of clean) {
      const price = maps.get(h.id)!.get(date) ?? firstClose.get(h.id) ?? null;
      if (price != null) val += price * h.qty;
    }
    if (date === ANCHOR_MONTH) base = val;
    const niftyV = niftyMap.get(date);
    timeline.push({
      date,
      portfolio: base > 0 ? (val / base) * 100 : 100,
      nifty:
        nifty0 != null && niftyV != null ? (niftyV / nifty0) * 100 : null,
      ideal: null,
    });
  }

  return {
    holdings: results,
    entryValue,
    exitValue,
    totalReturn,
    timeline,
    idealReturn: 0,
    performanceScore: 0,
    fundamentalScore: 0,
    finalScore: 0,
  };
}

export { ANCHOR_MONTH, END_MONTH };
export type { PricePoint };
