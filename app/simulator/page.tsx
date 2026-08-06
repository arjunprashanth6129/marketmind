import { Suspense } from "react";
import Link from "next/link";
import { STOCKS } from "@/lib/stocks";
import { entryPrice } from "@/lib/data";
import { isAuthed } from "@/lib/auth";
import { SIMULATOR_LOCKED } from "@/lib/flags";
import LoginGate from "./LoginGate";
import Simulator from "./Simulator";
import BackToBuilder from "./BackToBuilder";
import { IconLock, IconLogo } from "../components/Icons";

export const metadata = {
  title: SIMULATOR_LOCKED ? "Portfolio Simulator - host only" : "Portfolio Simulator",
};

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
    <>
      {/* The simulator keeps a dedicated header because of the logout action,
          but mirrors SiteHeader's structure so the chrome stays consistent. */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink-900/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-fg"
          >
            <span className="grid h-8 w-8 place-items-center rounded-md border border-line-strong bg-ink-800 p-1.5 text-accent transition-colors duration-200 group-hover:border-accent">
              <IconLogo />
            </span>
            <span className="text-[15px]">MarketMind</span>
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full border border-line-strong bg-ink-850 px-2.5 py-1 text-[11px] font-medium text-fg-muted sm:inline-flex">
            {SIMULATOR_LOCKED && <IconLock className="h-3 w-3" />}
            {SIMULATOR_LOCKED ? "Simulator · host only" : "Simulator"}
          </span>
          {/* No session to end while the gate is lifted, so the logout control
              would be a dead button. */}
          {SIMULATOR_LOCKED && (
            <form action="/api/simulator/logout" method="post" className="ml-auto">
              <button
                type="submit"
                className="cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium text-fg-muted transition-colors duration-200 hover:bg-ink-850 hover:text-fg"
              >
                Log out
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
        <Suspense fallback={null}>
          <BackToBuilder />
        </Suspense>
        <div className="mb-7 max-w-2xl">
          <p className="eyebrow">Host console</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-fg sm:text-3xl">
            Portfolio Simulator
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
            Pick a scenario, enter a team&apos;s portfolio, and reveal how it
            performed over the fixed June 2021 → June 2026 window.
          </p>
        </div>
        <Suspense fallback={null}>
          <Simulator stocks={stocks} entryPrices={entryPrices} />
        </Suspense>
      </main>
    </>
  );
}
