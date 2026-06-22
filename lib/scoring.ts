// SERVER-ONLY scoring layer.
//
// This module imports data/ideal-portfolios.json (the verified "model answer"
// portfolios). It must ONLY be imported by the "use server" action
// (app/simulator/actions.ts) — never by a client component — so the ideal
// stock picks never reach the student. Only the *indexed performance line*
// (numbers) and the resulting scores cross to the client, never the tickers.

import idealPortfolios from "@/data/ideal-portfolios.json";
import { computePortfolio, type Holding, type PortfolioResult } from "./calc";
import { getSnapshot } from "./data";

// The 10 deliberate "Bad" list tickers — auto-zero on the fundamental component.
const BAD = new Set([
  "RAJESHEXPO", "JPASSOCIAT", "RELAXO", "AAVAS", "AARTIIND",
  "ZEEL", "GUJGASLTD", "IGL", "PAYTM", "WIPRO",
]);

interface IdealEntry {
  return: number;
  series: Map<string, number>;
}
const IDEAL = new Map<string, IdealEntry>(
  (
    idealPortfolios as {
      scenarioId: string;
      portfolio_total_return_pct: number;
      monthly_indexed_series: { date: string; value: number }[];
    }[]
  ).map((p) => [
    p.scenarioId,
    {
      return: p.portfolio_total_return_pct,
      series: new Map(p.monthly_indexed_series.map((s) => [s.date, s.value])),
    },
  ]),
);

const round1 = (n: number) => Math.round(n * 10) / 10;

// Per-stock fundamental score (0–10) from June-2021 snapshot data.
export function fundamentalScore(id: string): number {
  if (BAD.has(id)) return 0; // Bad-list stock: auto-zero regardless of metrics
  const s = getSnapshot(id);
  if (!s) return 0;
  let pts = 0;

  // ROE: >25 = 3, 15–25 = 2, 5–15 = 1, <5/neg = 0
  const roe = s.roe;
  if (roe != null) {
    if (roe > 25) pts += 3;
    else if (roe >= 15) pts += 2;
    else if (roe >= 5) pts += 1;
  }

  // CFO: positive = 2, negative = 0  (FY2021 not flagged negative)
  const cfoPositive = !(s.cfoNegativeYears ?? []).includes("FY2021");
  if (cfoPositive) pts += 2;

  // D/E: <0.3 = 2, 0.3–1.0 = 1, >1.0 = 0.
  // Banks/NBFCs (D/E n/a): 1 pt if ROE and CFO are both healthy.
  const de = s.debtToEquity;
  if (de == null) {
    if (roe != null && roe >= 10 && cfoPositive) pts += 1;
  } else if (de < 0.3) pts += 2;
  else if (de <= 1.0) pts += 1;

  // Revenue/Profit consistency: both 3yr CAGR positive AND EPS "tracks net
  // profit" = 2; partial = 1; declining (negative CAGR or loss flag) = 0.
  const rev = s.revenueGrowth3yr;
  const prof = s.profitGrowth3yr;
  const note = s.epsConsistencyNote ?? "";
  const tracks = /in line|tracks net profit/i.test(note);
  const lossFlag = /loss-making/i.test(note);
  if (lossFlag || (rev != null && rev < 0) || (prof != null && prof < 0)) {
    // declining → 0 pts
  } else if (rev != null && prof != null && rev > 0 && prof > 0 && tracks) {
    pts += 2;
  } else {
    pts += 1; // partial
  }

  // Promoter holding: >50 = 1, 25–50 = 0.5, <25 / no promoter = 0
  const pr = s.promoterHolding;
  if (pr != null && pr > 50) pts += 1;
  else if (pr != null && pr >= 25) pts += 0.5;

  return Math.min(10, pts);
}

// Performance score (0–10): participant return vs the scenario IDEAL return.
export function performanceScore(participantReturn: number, idealReturn: number): number {
  if (participantReturn < 0) return 0;
  if (idealReturn <= 0) return 10;
  const rel = participantReturn / idealReturn;
  if (rel >= 1) return 10; // cap at 10 even if they beat the ideal
  return Math.max(1, Math.floor(rel * 10));
}

export function scoreSimulation(
  scenarioId: string,
  holdings: Holding[],
): PortfolioResult | { error: string } {
  const ideal = IDEAL.get(scenarioId);
  if (!ideal) return { error: "Unknown scenario." };

  const result = computePortfolio(holdings);

  // per-stock fundamental scores
  result.holdings = result.holdings.map((h) => ({
    ...h,
    fundamentalScore: fundamentalScore(h.id),
  }));
  const fund = result.holdings.length
    ? result.holdings.reduce((s, h) => s + (h.fundamentalScore ?? 0), 0) /
      result.holdings.length
    : 0;
  const perf = performanceScore(result.totalReturn, ideal.return);

  // merge the ideal portfolio's indexed line into the timeline (numbers only)
  result.timeline = result.timeline.map((t) => ({
    ...t,
    ideal: ideal.series.get(t.date) ?? null,
  }));

  result.idealReturn = ideal.return;
  result.performanceScore = perf;
  result.fundamentalScore = round1(fund);
  result.finalScore = round1(perf * 0.5 + fund * 0.5);
  return result;
}
