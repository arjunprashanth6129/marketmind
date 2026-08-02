"use client";

import { cn } from "@/lib/utils";

export type ChartMode = "line" | "candle";

/** Segmented line/candle switch, styled as one control rather than two buttons. */
export default function ChartToggle({
  mode,
  onChange,
  className,
}: {
  mode: ChartMode;
  onChange: (mode: ChartMode) => void;
  className?: string;
}) {
  const options: { value: ChartMode; label: string; icon: React.ReactNode }[] = [
    {
      value: "line",
      label: "Line",
      icon: (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <path
            d="M2 11.5 6 7l3 3 5-6.5"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      value: "candle",
      label: "Candles",
      icon: (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
          <g stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
            <path d="M5 2v2.5M5 11.5V14M11 3.5V6M11 12v2" />
            <rect x="3.2" y="4.5" width="3.6" height="7" rx="0.5" />
            <rect x="9.2" y="6" width="3.6" height="6" rx="0.5" />
          </g>
        </svg>
      ),
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Chart type"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-line bg-ink-900 p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors duration-200",
              active
                ? "bg-ink-700 text-fg"
                : "text-fg-dim hover:text-fg-muted",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
