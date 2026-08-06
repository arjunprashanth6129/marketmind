// Shared state for the guided "play" flow:
//   /play  ->  /screener  ->  /build  ->  /simulator  ->  score
//
// The assigned scenario travels as a `?scenario=` query param so a link can be
// shared or reloaded, and is mirrored into sessionStorage so it survives the
// simulator's login redirect (which drops the query string).
//
// The drafted portfolio is sessionStorage-only: it is too big for a URL and
// only needs to survive the one hop from the builder into the simulator.

import { SCENARIOS, type Scenario } from "./scenarios";

export const SCENARIO_PARAM = "scenario";
const STORAGE_KEY = "marketmind:scenario";
const PORTFOLIO_KEY = "marketmind:portfolio";

/** A drafted holding, as handed from the builder to the simulator. */
export interface DraftHolding {
  id: string;
  qty: number;
}

/** Matches MAX_HOLDINGS in the simulator's server action. */
export const MAX_POSITIONS = 5;

/** Resolve a scenario id from a query param, ignoring anything unrecognised. */
export function scenarioFromParam(
  value: string | string[] | undefined,
): Scenario | null {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) return null;
  return SCENARIOS.find((s) => s.id === id) ?? null;
}

/** Uniform pick across the five investor profiles. */
export function randomScenario(): Scenario {
  return SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
}

export function rememberScenario(id: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private browsing or storage disabled - the query param still carries it.
  }
}

export function recallScenario(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearScenario(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

/** Hand the drafted portfolio from /build to /simulator. */
export function rememberPortfolio(holdings: DraftHolding[]): void {
  try {
    sessionStorage.setItem(PORTFOLIO_KEY, JSON.stringify(holdings));
  } catch {
    // Storage unavailable - the simulator just starts empty.
  }
}

/**
 * Read back a drafted portfolio. Defensive about shape: this comes out of
 * storage a user can edit, and a malformed entry should degrade to an empty
 * draft rather than throw during render.
 */
export function recallPortfolio(): DraftHolding[] {
  try {
    const raw = sessionStorage.getItem(PORTFOLIO_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((h) => ({
        id: String((h as DraftHolding)?.id ?? ""),
        qty: Math.floor(Number((h as DraftHolding)?.qty)),
      }))
      .filter((h) => h.id && Number.isFinite(h.qty) && h.qty > 0)
      .slice(0, MAX_POSITIONS);
  } catch {
    return [];
  }
}

export function clearPortfolio(): void {
  try {
    sessionStorage.removeItem(PORTFOLIO_KEY);
  } catch {
    // no-op
  }
}
