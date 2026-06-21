// Typed access to the static JSON data layer (all data: fixed window
// Jan 2000 – June 2026, anchored to the reproducible June-2026 reference date).

import pricesJson from "@/data/prices.json";
import niftyJson from "@/data/nifty.json";
import financialsJson from "@/data/financials.json";
import snapshotJson from "@/data/snapshot-2021.json";

export const ANCHOR_MONTH = "2021-06-01"; // June 2021 — the "time capsule" date
export const END_MONTH = "2026-06-01"; // fixed reproducible end of window

export interface PricePoint {
  date: string; // "YYYY-MM-01"
  close: number;
}

export interface YearFin {
  revenue: number | null;
  netProfit: number | null;
  eps: number | null;
  cfo: number | null;
}

export interface Snapshot {
  name: string;
  companyBlurb: string; // neutral 2-3 sentence June-2021 company profile
  sector: string;
  price: number | null; // June-2021 close (null if not yet listed, e.g. PAYTM)
  ipoMonth: string | null; // "YYYY-MM" if listed after the anchor
  effectiveEntry: number | null; // June-2021 close, or first listed close for post-anchor IPOs
  negNetWorth: boolean;
  marketCap: number | null;
  marketCapCategory: "Large" | "Mid" | "Small" | "Micro" | null;
  pe: number | null;
  dividendYield: number | null;
  roe: number | null;
  debtToEquity: number | null;
  promoterHolding: number | null;
  promoterHoldingAsOf: string | null;
  gpm: number | null; // gross margin — null (not exposed by screener); see opm
  opm: number | null;
  eps: number | null;
  revenueGrowth3yr: number | null; // FY2018→FY2021 CAGR %
  revenueGrowth5yr: number | null; // FY2016→FY2021 CAGR %
  profitGrowth3yr: number | null;
  profitGrowth5yr: number | null;
  epsConsistencyNote: string | null;
  cfoNegativeYears: string[];
}

const prices = pricesJson as Record<string, PricePoint[]>;
const nifty = niftyJson as PricePoint[];
const financials = financialsJson as Record<
  string,
  Record<string, YearFin | null>
>;
const snapshots = snapshotJson as Record<string, Snapshot>;

export const FIN_YEARS = ["FY2015", "FY2016", "FY2017", "FY2018", "FY2019", "FY2020", "FY2021"];

export function getSnapshot(id: string): Snapshot | undefined {
  return snapshots[id];
}

export function getAllSnapshots(): Record<string, Snapshot> {
  return snapshots;
}

export function getFinancials(id: string): Record<string, YearFin | null> {
  return financials[id] ?? {};
}

export function getFullPrices(id: string): PricePoint[] {
  return prices[id] ?? [];
}

// Screener long-term chart: Jan 2000 – June 2021 (never shows beyond June 2021).
export function getScreenerPrices(id: string): PricePoint[] {
  return getFullPrices(id).filter((p) => p.date <= ANCHOR_MONTH);
}

// Simulator window: June 2021 – June 2026 (inclusive of both anchors).
export function getSimPrices(id: string): PricePoint[] {
  return getFullPrices(id).filter(
    (p) => p.date >= ANCHOR_MONTH && p.date <= END_MONTH,
  );
}

export function getNiftySim(): PricePoint[] {
  return nifty.filter((p) => p.date >= ANCHOR_MONTH && p.date <= END_MONTH);
}

export function priceAt(id: string, month: string): number | null {
  const p = getFullPrices(id).find((x) => x.date === month);
  return p ? p.close : null;
}

// Entry = June-2021 close, or — for stocks that listed after the anchor
// (PAYTM, IPO Nov 2021) — the first available close in the window, flagged
// via Snapshot.ipoMonth / effectiveEntry.
export function entryPrice(id: string): number | null {
  const at = priceAt(id, ANCHOR_MONTH);
  if (at != null) return at;
  const sim = getSimPrices(id);
  return sim.length ? sim[0].close : null;
}

// First available month in the simulator window (anchor, or listing month).
export function entryMonth(id: string): string {
  if (priceAt(id, ANCHOR_MONTH) != null) return ANCHOR_MONTH;
  const sim = getSimPrices(id);
  return sim.length ? sim[0].date : ANCHOR_MONTH;
}

export function exitPrice(id: string): number | null {
  return priceAt(id, END_MONTH);
}
