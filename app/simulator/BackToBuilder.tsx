"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconArrowRight } from "../components/Icons";

/**
 * Back link into the portfolio builder.
 *
 * Carries the scenario through so returning to /build restores the same
 * mandate and budget. The draft itself lives in sessionStorage, so edits made
 * on the way back are preserved.
 */
export default function BackToBuilder() {
  const scenario = useSearchParams().get("scenario");
  const href = scenario
    ? `/build?scenario=${encodeURIComponent(scenario)}`
    : "/build";

  return (
    <Link
      href={href}
      className="group mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors duration-200 hover:text-fg"
    >
      <IconArrowRight className="h-4 w-4 rotate-180 transition-transform duration-200 group-hover:-translate-x-0.5" />
      Portfolio builder
    </Link>
  );
}
