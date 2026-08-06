import { Suspense } from "react";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import PortfolioBuilder, { type BuilderStock } from "./PortfolioBuilder";
import { STOCKS } from "@/lib/stocks";
import { entryPrice, getSnapshot } from "@/lib/data";

export const metadata = {
  title: "Portfolio Builder",
  description:
    "Build a five-stock portfolio inside your investor's capital budget, priced at the June-2021 close.",
};

export default function BuildPage() {
  // Entry prices are the June-2021 closes the simulator will actually charge,
  // so the cost shown here is the cost that gets backtested - no surprises at
  // the next step.
  const stocks: BuilderStock[] = STOCKS.map((s) => {
    const snap = getSnapshot(s.id);
    return {
      id: s.id,
      name: s.name,
      sector: s.sector,
      price: entryPrice(s.id),
      cap: snap?.marketCapCategory ?? null,
    };
  }).filter((s) => s.price != null);

  return (
    <>
      <SiteHeader context="Prices · June 2021 close" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">
        <Suspense fallback={null}>
          <PortfolioBuilder stocks={stocks} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
