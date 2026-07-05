import Link from "next/link";
import { STOCKS } from "@/lib/stocks";
import { entryPrice } from "@/lib/data";
import { isAuthed } from "@/lib/auth";
import LoginGate from "./LoginGate";
import Simulator from "./Simulator";

export const metadata = { title: "Portfolio Simulator - host only" };

export default async function SimulatorPage() {
  const configured = Boolean(process.env.SIMULATOR_PASSWORD);
  if (!(await isAuthed())) {
    return <LoginGate configured={configured} />;
  }

  const stocks = STOCKS.map((s) => ({ id: s.id, name: s.name }));
  const entryPrices: Record<string, number> = {};
  for (const s of STOCKS) {
    const p = entryPrice(s.id);
    if (p != null) entryPrices[s.id] = p;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link href="/" className="font-semibold text-slate-100">
            MarketMind
          </Link>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            Simulator · host only
          </span>
          <form action="/api/simulator/logout" method="post" className="ml-auto">
            <button
              className="text-xs text-slate-400 hover:text-slate-200"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Portfolio Simulator</h1>
          <p className="mt-1 text-sm text-slate-400">
            Pick a scenario, enter a team&apos;s portfolio, and reveal how it
            performed over the fixed June 2021 → June 2026 window.
          </p>
        </div>
        <Simulator stocks={stocks} entryPrices={entryPrices} />
      </main>
    </div>
  );
}
