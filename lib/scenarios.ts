// The 5 portfolio-building scenarios. Names + descriptions per the project spec;
// capex + accent colours mirror the FLP "Team Scenarios" handout.
// The `ideal` "model answer" for each scenario is NOT hardcoded here — it is
// read from data/ideal-portfolios.json (the verified, fundamentals+return
// screened portfolios). Reference data only; NEVER rendered in any UI.

import idealPortfolios from "@/data/ideal-portfolios.json";

export interface Scenario {
  id: string;
  name: string;
  description: string;
  capex: number; // ₹
  capexLabel: string;
  accent: string; // hex, matches the printed handout
  ideal: string[]; // verified ideal-portfolio tickers, from ideal-portfolios.json
}

// scenarioId -> ordered ticker list, sourced from the verified portfolios.
const IDEAL_BY_SCENARIO = new Map<string, string[]>(
  (idealPortfolios as { scenarioId: string; stocks: { ticker: string }[] }[]).map(
    (p) => [p.scenarioId, p.stocks.map((s) => s.ticker)],
  ),
);

const idealFor = (id: string): string[] => IDEAL_BY_SCENARIO.get(id) ?? [];

const SCENARIO_META: Omit<Scenario, "ideal">[] = [
  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    description:
      "Just finished college, first job, no dependents, high risk tolerance, long horizon.",
    capex: 50000,
    capexLabel: "Rs. 50,000",
    accent: "#3b5bdb",
  },
  {
    id: "newly-married",
    name: "Newly Married Couple",
    description:
      "Dual income, no kids yet, moderate-high risk, 25-30 yr horizon.",
    capex: 200000,
    capexLabel: "Rs. 2,00,000",
    accent: "#7048e8",
  },
  {
    id: "young-family",
    name: "Young Family with Toddlers",
    description:
      "Two kids under 5, investing for college funds + family security, moderate risk.",
    capex: 300000,
    capexLabel: "Rs. 3,00,000",
    accent: "#e8830c",
  },
  {
    id: "pre-retirement",
    name: "Pre-Retirement Family",
    description:
      "Both parents working, two kids in higher education, 5-8 yrs from retirement, lower-moderate risk.",
    capex: 500000,
    capexLabel: "Rs. 5,00,000",
    accent: "#d6455e",
  },
  {
    id: "elderly-retired",
    name: "Elderly Retired Couple",
    description:
      "Living off retirement corpus + pension, low risk, dividend/stability focus.",
    capex: 100000,
    capexLabel: "Rs. 1,00,000",
    accent: "#2f9e7f",
  },
];

export const SCENARIOS: Scenario[] = SCENARIO_META.map((m) => ({
  ...m,
  ideal: idealFor(m.id),
}));

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
