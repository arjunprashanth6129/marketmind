"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SCENARIOS } from "@/lib/scenarios";
import ScenarioBanner from "./ScenarioBanner";

/**
 * Client-side reader for the `?scenario=` play-flow param.
 *
 * Deliberately not read via server `searchParams`: the screener index and all
 * 100 stock pages are statically generated, and touching server searchParams
 * would opt every one of them into dynamic rendering. Reading it on the client
 * inside Suspense keeps the static shell and just hydrates the banner in.
 */
function Inner({ compact }: { compact?: boolean }) {
  const id = useSearchParams().get("scenario");
  const scenario = SCENARIOS.find((s) => s.id === id);
  if (!scenario) return null;
  return <ScenarioBanner scenario={scenario} compact={compact} />;
}

export default function ScenarioBannerSlot({ compact }: { compact?: boolean }) {
  return (
    <Suspense fallback={null}>
      <Inner compact={compact} />
    </Suspense>
  );
}
