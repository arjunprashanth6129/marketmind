"use server";

import { type Holding, type PortfolioResult } from "@/lib/calc";
import { scoreSimulation } from "@/lib/scoring";
import { getSnapshot } from "@/lib/data";
import { isAuthed } from "@/lib/auth";

const MAX_HOLDINGS = 5;
const MAX_QTY = 1_000_000;

export async function runSimulation(
  scenarioId: string,
  holdings: Holding[],
): Promise<PortfolioResult | { error: string }> {
  if (!(await isAuthed())) return { error: "Not authorised." };
  if (!Array.isArray(holdings)) return { error: "Bad request." };

  const clean: Holding[] = [];
  for (const h of holdings.slice(0, MAX_HOLDINGS)) {
    const id = String(h?.id ?? "");
    const qty = Math.floor(Number(h?.qty));
    if (!id || !Number.isFinite(qty) || qty <= 0) continue;
    if (!getSnapshot(id)) return { error: `Unknown stock: ${id}` };
    clean.push({ id, qty: Math.min(qty, MAX_QTY) });
  }
  if (clean.length === 0) return { error: "Add at least one holding." };

  // Scoring (performance vs the Nifty 50 + scenario-weighted fundamentals) runs
  // here on the server, behind the host password gate.
  return scoreSimulation(String(scenarioId), clean);
}
