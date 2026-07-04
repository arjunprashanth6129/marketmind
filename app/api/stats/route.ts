import snapshot from "@/data/snapshot-2021.json";
import nifty from "@/data/nifty.json";
import { PROJECT } from "@/lib/stats";
import { SCENARIOS } from "@/lib/scenarios";

// Public JSON stats endpoint - derives key figures live from the data layer.
export const dynamic = "force-static";

export function GET() {
  const snap = snapshot as Record<string, unknown>;
  const series = nifty as { date: string; close: number }[];
  const at = (d: string) => series.find((p) => p.date === d)?.close ?? null;
  const n0 = at("2021-06-01");
  const n1 = at("2026-06-01");
  const niftyReturn =
    n0 && n1 ? Math.round((n1 / n0 - 1) * 1000) / 10 : PROJECT.niftyReturn;

  return Response.json({
    project: PROJECT.name,
    description: PROJECT.description,
    stockCount: Object.keys(snap).length,
    financialYears: ["FY2015", "FY2016", "FY2017", "FY2018", "FY2019", "FY2020", "FY2021"],
    faMetricsPerStock: 10,
    priceHistory: { from: "2000-01", to: "2026-06" },
    simulationWindow: { entry: "2021-06", exit: "2026-06" },
    niftyBenchmarkReturnPct: niftyReturn,
    scoring: {
      final: "0.5 * performance + 0.5 * fundamentals",
      performance: "participant return vs the Nifty 50",
      fundamentals: "scenario-weighted per-stock quality (growth/value/income/stability/quality)",
    },
    scenarios: SCENARIOS.map((s) => ({ id: s.id, name: s.name, risk: s.risk, fund: s.fund })),
    repo: PROJECT.github,
    generatedAt: "static-build",
  });
}
