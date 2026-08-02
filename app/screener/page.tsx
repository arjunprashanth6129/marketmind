import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { Suspense } from "react";
import ScenarioBannerSlot from "../components/ScenarioBannerSlot";
import { STOCKS } from "@/lib/stocks";
import { getSnapshot } from "@/lib/data";
import ScreenerGrid, { type ScreenerRow } from "./ScreenerGrid";

export const metadata = {
  title: "Screener - 50 NSE stocks as of June 2021",
};

export default function ScreenerLanding() {
  const rows: ScreenerRow[] = STOCKS.map((s) => {
    const snap = getSnapshot(s.id);
    return {
      id: s.id,
      name: s.name,
      sector: s.sector,
      price: snap?.price ?? null,
      marketCap: snap?.marketCap ?? null,
      marketCapCategory: snap?.marketCapCategory ?? null,
      pe: snap?.pe ?? null,
      roe: snap?.roe ?? null,
      divYield: snap?.dividendYield ?? null,
      de: snap?.debtToEquity ?? null,
    };
  });
  // Default order: market cap descending - a natural screener feel that
  // interleaves strong and weak picks (the UI never flags which is which).
  rows.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));

  return (
    <>
      <SiteHeader context="Data frozen · June 2021" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">
        <ScenarioBannerSlot />
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow">Stock screener</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-fg sm:text-4xl">
            {STOCKS.length} NSE companies, as they looked in June 2021
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">
            The universe at the simulation&apos;s starting line. Every company
            opens to a full time-capsule page: snapshot ratios, FY2015-FY2021
            financials, a long-term price chart, and a peer comparison. Nothing
            here shows data past June 2021.
          </p>
        </div>
        <Suspense fallback={null}>
          <ScreenerGrid rows={rows} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
