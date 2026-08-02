"use client";

/**
 * Flip card - front shows the headline, back reveals the detail on hover.
 *
 * Adapted from the kokonutui component (kokonutui.com): retinted from the
 * original zinc/orange to the MarketMind ink palette and single blue accent,
 * given a real link target instead of a dead button, and made keyboard- and
 * reduced-motion-accessible (the original flipped on hover only, which left it
 * unreachable by keyboard).
 */

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "./Icons";

export interface CardFlipProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon?: React.ReactNode;
  href?: string;
  ctaLabel?: string;
}

export default function CardFlip({
  title,
  subtitle,
  description,
  features,
  icon,
  href,
  ctaLabel = "Explore",
}: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const face =
    "absolute inset-0 h-full w-full [backface-visibility:hidden] overflow-hidden rounded-xl border border-line bg-ink-900";

  return (
    <div
      className="group relative h-[300px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onFocusCapture={() => setIsFlipped(true)}
      onBlurCapture={(e) => {
        // Only unflip once focus has actually left the card.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFlipped(false);
        }
      }}
    >
      <div
        className={cn(
          "relative h-full w-full [transform-style:preserve-3d]",
          "transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]",
          "motion-reduce:transition-none",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
        )}
      >
        {/* ---- Front ---- */}
        <div className={cn(face, "[transform:rotateY(0deg)]")}>
          <div className="flex h-full flex-col justify-between p-6">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-line-strong bg-ink-850 text-accent">
              {icon}
            </span>

            {/* Faint candle motif, purely decorative. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-[42%] flex -translate-y-1/2 items-end justify-center gap-1.5 opacity-[0.13]"
            >
              {[14, 26, 18, 34, 22, 40, 30].map((h, i) => (
                <span
                  key={i}
                  className={i % 3 === 0 ? "bg-neg" : "bg-accent"}
                  style={{ width: 4, height: h, display: "block" }}
                />
              ))}
            </div>

            <div className="relative">
              <h3 className="text-[15px] font-semibold leading-snug text-fg">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">
                {subtitle}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-fg-dim">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M17 2.1 21 6l-4 3.9M21 6H9a5 5 0 0 0-5 5v1" />
                  <path d="M7 21.9 3 18l4-3.9M3 18h12a5 5 0 0 0 5-5v-1" />
                </svg>
                Hover to flip
              </p>
            </div>
          </div>
        </div>

        {/* ---- Back ---- */}
        <div
          className={cn(
            face,
            "[transform:rotateY(180deg)] flex flex-col bg-ink-850 p-6",
          )}
        >
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold leading-snug text-fg">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {description}
            </p>

            <ul className="mt-4 space-y-2">
              {features.map((feature, index) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-[13px] text-fg-muted transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  style={{
                    transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 50 + 150}ms`,
                  }}
                >
                  <span
                    aria-hidden
                    className="h-1 w-1 shrink-0 rounded-full bg-accent"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {href && (
            <Link
              href={href}
              className="group/cta mt-5 flex items-center justify-between rounded-lg border border-line bg-ink-900 px-3.5 py-2.5 transition-colors duration-200 hover:border-accent/50 hover:bg-accent/10"
            >
              <span className="text-[13px] font-medium text-fg transition-colors duration-200 group-hover/cta:text-accent">
                {ctaLabel}
              </span>
              <IconArrowRight className="h-4 w-4 text-accent transition-transform duration-200 group-hover/cta:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
