// The 5 portfolio-building scenarios.
// Names + descriptions per the project spec; capex + accent colours mirror the
// FLP "Team Scenarios" handout.
//
// Each scenario also carries a fundamental-weight profile (`fund`). The scoring
// layer (lib/scoring.ts) computes the same five 0-1 sub-scores for every stock
// - growth, value, income, stability, quality - and weights them per scenario,
// so the *same* stock scores differently for a risk-hungry graduate than for a
// capital-preserving retiree. Weights sum to 1 within each scenario. Tune these
// numbers to reshape what each investor profile rewards; no logic changes.

export interface FundWeights {
  growth: number; // rewards high ROE + revenue/profit CAGR (compounders)
  value: number; // rewards low P/E (penalises overpaying)
  income: number; // rewards dividend yield
  stability: number; // rewards low leverage, large-cap size, positive CFO
  quality: number; // rewards CFO, promoter holding, earnings consistency
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  capex: number; // ₹
  capexLabel: string;
  accent: string; // hex, matches the printed handout
  risk: string; // risk-level label shown on the scenario card
  fund: FundWeights; // per-scenario fundamental emphasis (sums to 1)
}

export const SCENARIOS: Scenario[] = [
  {
    id: "fresh-graduate",
    name: "Fresh Graduate",
    description:
      "Just finished college, first job, no dependents, high risk tolerance, long horizon.",
    capex: 50000,
    capexLabel: "Rs. 50,000",
    accent: "#3b5bdb",
    risk: "High risk",
    // Chases compounders; tolerates a rich P/E, needs no dividend.
    fund: { growth: 0.45, value: 0.05, income: 0.0, stability: 0.1, quality: 0.4 },
  },
  {
    id: "newly-married",
    name: "Newly Married Couple",
    description:
      "Dual income, no kids yet, moderate-high risk, 25-30 yr horizon.",
    capex: 200000,
    capexLabel: "Rs. 2,00,000",
    accent: "#7048e8",
    risk: "Moderate-high risk",
    fund: { growth: 0.35, value: 0.1, income: 0.05, stability: 0.15, quality: 0.35 },
  },
  {
    id: "young-family",
    name: "Young Family with Toddlers",
    description:
      "Two kids under 5, investing for college funds + family security, moderate risk.",
    capex: 300000,
    capexLabel: "Rs. 3,00,000",
    accent: "#e8830c",
    risk: "Moderate risk",
    fund: { growth: 0.25, value: 0.15, income: 0.1, stability: 0.2, quality: 0.3 },
  },
  {
    id: "pre-retirement",
    name: "Pre-Retirement Family",
    description:
      "Both parents working, two kids in higher education, 5-8 yrs from retirement, lower-moderate risk.",
    capex: 500000,
    capexLabel: "Rs. 5,00,000",
    accent: "#d6455e",
    risk: "Lower-moderate risk",
    fund: { growth: 0.1, value: 0.2, income: 0.2, stability: 0.25, quality: 0.25 },
  },
  {
    id: "elderly-retired",
    name: "Elderly Retired Couple",
    description:
      "Living off retirement corpus + pension, low risk, dividend/stability focus.",
    capex: 100000,
    capexLabel: "Rs. 1,00,000",
    accent: "#2f9e7f",
    risk: "Low risk",
    // Capital preservation: income + stability + valuation over growth.
    fund: { growth: 0.05, value: 0.2, income: 0.3, stability: 0.25, quality: 0.2 },
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
