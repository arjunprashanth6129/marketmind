// Scoring layer: performance vs the Nifty 50 + scenario-weighted fundamentals.
//
// There is no hidden "answer key" any more - both halves of the score run on
// public June-2021 snapshot data and the public Nifty series, so the maths is
// fully explainable to students. It still runs behind the "use server" action
// (app/simulator/actions.ts) so results only reveal when the host runs them.

import { computePortfolio, type Holding, type PortfolioResult } from "./calc";
import { getSnapshot, getNiftySim, type Snapshot } from "./data";
import { getScenario } from "./scenarios";

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (lo: number, hi: number, n: number) => Math.max(lo, Math.min(hi, n));

// Nifty 50 total return over the fixed window (first vs last month of the
// simulator series). Computed once - the window is frozen, so this is constant.
const NIFTY_RETURN = (() => {
  const s = getNiftySim();
  if (s.length < 2) return 0;
  return (s[s.length - 1].close / s[0].close - 1) * 100;
})();

export function niftyReturnPct(): number {
  return round1(NIFTY_RETURN);
}

// ---- The five 0-1 fundamental sub-scores (same for every stock) ----------

const cfoPositive = (s: Snapshot) => (!(s.cfoNegativeYears ?? []).includes("FY2021") ? 1 : 0);

// Growth: high ROE + healthy revenue/profit CAGR → a compounder.
function growthSub(s: Snapshot): number {
  const roe = s.roe;
  const roeScore =
    roe == null ? 0 : roe > 25 ? 1 : roe >= 15 ? 0.7 : roe >= 10 ? 0.4 : roe >= 5 ? 0.2 : 0;

  const cagrs = [s.revenueGrowth3yr, s.profitGrowth3yr].filter((x): x is number => x != null);
  const avg = cagrs.length ? cagrs.reduce((a, b) => a + b, 0) / cagrs.length : null;
  const cagrScore =
    avg == null ? 0 : avg > 20 ? 1 : avg >= 10 ? 0.7 : avg >= 5 ? 0.4 : avg >= 0 ? 0.2 : 0;

  return 0.5 * roeScore + 0.5 * cagrScore;
}

// Value: low P/E scores high; loss-making / no earnings (null or <=0) → 0.
function valueSub(s: Snapshot): number {
  const pe = s.pe;
  if (pe == null || pe <= 0) return 0;
  return pe < 12 ? 1 : pe < 18 ? 0.8 : pe < 25 ? 0.6 : pe < 35 ? 0.35 : pe < 50 ? 0.15 : 0;
}

// Income: dividend yield.
function incomeSub(s: Snapshot): number {
  const dy = s.dividendYield;
  if (dy == null || dy <= 0) return 0;
  return dy >= 4 ? 1 : dy >= 3 ? 0.8 : dy >= 2 ? 0.6 : dy >= 1 ? 0.35 : 0.1;
}

// Stability: low leverage + large-cap size + positive operating cash flow.
function stabilitySub(s: Snapshot): number {
  const de = s.debtToEquity;
  const deScore =
    de == null ? 0.5 // banks/NBFCs: D/E not meaningful → neutral
      : de < 0.3 ? 1 : de < 0.6 ? 0.8 : de < 1 ? 0.5 : de < 2 ? 0.25 : 0;
  const cap = s.marketCapCategory;
  const capScore =
    cap === "Large" ? 1 : cap === "Mid" ? 0.6 : cap === "Small" ? 0.3 : cap === "Micro" ? 0.1 : 0.3;
  return 0.45 * deScore + 0.35 * capScore + 0.2 * cfoPositive(s);
}

// Quality: cash flow, promoter skin-in-the-game, earnings consistency.
function qualitySub(s: Snapshot): number {
  const pr = s.promoterHolding;
  const promoterScore = pr == null ? 0 : pr > 50 ? 1 : pr >= 25 ? 0.6 : pr > 0 ? 0.2 : 0;

  const note = s.epsConsistencyNote ?? "";
  const tracks = /in line|tracks net profit/i.test(note);
  const lossFlag = /loss-making/i.test(note);
  const rev = s.revenueGrowth3yr;
  const prof = s.profitGrowth3yr;
  let consistency: number;
  if (lossFlag || (rev != null && rev < 0) || (prof != null && prof < 0)) consistency = 0;
  else if (rev != null && prof != null && rev > 0 && prof > 0 && tracks) consistency = 1;
  else consistency = 0.5;

  return 0.4 * cfoPositive(s) + 0.3 * promoterScore + 0.3 * consistency;
}

// Per-stock fundamental score (0-10), weighted by the scenario's profile.
export function fundamentalScore(id: string, scenarioId: string): number {
  const s = getSnapshot(id);
  const scenario = getScenario(scenarioId);
  if (!s || !scenario) return 0;
  const w = scenario.fund;
  const total =
    w.growth * growthSub(s) +
    w.value * valueSub(s) +
    w.income * incomeSub(s) +
    w.stability * stabilitySub(s) +
    w.quality * qualitySub(s);
  return clamp(0, 10, total * 10);
}

// Performance score (0-10): participant return vs the Nifty 50.
// Matching the index scores ~7; beating it by 50%+ caps at 10; a loss = 0.
export function performanceScore(participantReturn: number, benchmarkReturn: number): number {
  if (participantReturn < 0) return 0;
  if (benchmarkReturn <= 0) return 10;
  const rel = participantReturn / benchmarkReturn;
  return clamp(1, 10, Math.round(1 + 6 * Math.min(rel, 1.5)));
}

export function scoreSimulation(
  scenarioId: string,
  holdings: Holding[],
): PortfolioResult | { error: string } {
  if (!getScenario(scenarioId)) return { error: "Unknown scenario." };

  const result = computePortfolio(holdings);

  // per-stock fundamental scores, weighted for this scenario
  result.holdings = result.holdings.map((h) => ({
    ...h,
    fundamentalScore: fundamentalScore(h.id, scenarioId),
  }));
  const fund = result.holdings.length
    ? result.holdings.reduce((s, h) => s + (h.fundamentalScore ?? 0), 0) /
      result.holdings.length
    : 0;
  const perf = performanceScore(result.totalReturn, NIFTY_RETURN);

  result.niftyReturn = round1(NIFTY_RETURN);
  result.performanceScore = perf;
  result.fundamentalScore = round1(fund);
  result.finalScore = round1(perf * 0.5 + fund * 0.5);
  return result;
}
