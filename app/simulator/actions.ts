"use server";

import { cookies } from "next/headers";
import { type Holding, type PortfolioResult } from "@/lib/calc";
import { scoreSimulation } from "@/lib/scoring";

async function isAuthed(): Promise<boolean> {
  const pw = process.env.SIMULATOR_PASSWORD;
  if (!pw) return false;
  const store = await cookies();
  return store.get("sim_session")?.value === pw;
}

export async function runSimulation(
  scenarioId: string,
  holdings: Holding[],
): Promise<PortfolioResult | { error: string }> {
  if (!(await isAuthed())) return { error: "Not authorised." };
  const clean = (holdings ?? [])
    .filter((h) => h && h.id && Number(h.qty) > 0)
    .map((h) => ({ id: String(h.id), qty: Math.floor(Number(h.qty)) }));
  if (clean.length === 0) return { error: "Add at least one holding." };
  // Scoring (performance vs the Nifty 50 + scenario-weighted fundamentals) runs
  // here on the server, behind the host password gate.
  return scoreSimulation(String(scenarioId), clean);
}
