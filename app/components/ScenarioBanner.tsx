import Link from "next/link";
import type { Scenario } from "@/lib/scenarios";
import { rupee } from "@/lib/format";
import { IconArrowRight, IconUsers } from "./Icons";

/**
 * Sticky context strip shown while a player is researching for an assigned
 * investor. Keeps the brief and the budget on screen, and offers the exit into
 * the simulator - otherwise a player has to remember who they're buying for
 * while reading 50 company pages.
 */
export default function ScenarioBanner({
  scenario,
  compact = false,
}: {
  scenario: Scenario;
  compact?: boolean;
}) {
  return (
    <div
      className="mb-6 overflow-hidden rounded-xl border bg-ink-850/60"
      style={{ borderColor: `${scenario.accent}55` }}
    >
      <div className="flex flex-wrap items-center gap-4 p-4">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border"
          style={{
            borderColor: `${scenario.accent}55`,
            backgroundColor: `${scenario.accent}1a`,
            color: scenario.accent,
          }}
        >
          <IconUsers className="h-[18px] w-[18px]" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-fg-dim">
            You are investing for
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-fg">
            {scenario.name}
            <span
              className="ml-2 rounded border px-1.5 py-0.5 text-[10px] font-medium align-middle"
              style={{
                color: scenario.accent,
                borderColor: `${scenario.accent}55`,
                backgroundColor: `${scenario.accent}1a`,
              }}
            >
              {scenario.risk}
            </span>
          </p>
          {!compact && (
            <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">
              {scenario.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-fg-dim">
              Budget
            </p>
            <p className="tnum mt-0.5 text-[15px] font-semibold text-fg">
              {rupee(scenario.capex)}
            </p>
          </div>
          <Link
            href={`/simulator?scenario=${scenario.id}`}
            className="group inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-accent px-4 py-2.5 text-[13px] font-semibold text-ink-950 transition-colors duration-200 hover:bg-[#6ba0ff]"
          >
            Build portfolio
            <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
