// Shared state for the guided "play" flow:
//   /play  ->  /screener  ->  /simulator  ->  score
//
// The assigned scenario travels as a `?scenario=` query param so a link can be
// shared or reloaded, and is mirrored into sessionStorage so it survives the
// simulator's login redirect (which drops the query string).

import { SCENARIOS, type Scenario } from "./scenarios";

export const SCENARIO_PARAM = "scenario";
const STORAGE_KEY = "marketmind:scenario";

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
