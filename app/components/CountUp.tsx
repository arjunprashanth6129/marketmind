"use client";

import { useEffect, useRef, useState } from "react";

// Counts up to `value` when scrolled into view (eased). Reduced-motion safe.
export default function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  durationMs = 1400,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Start at the real value so the figure is correct during SSR, without JS,
  // and whenever the element never scrolls into view. The count-up only takes
  // over once the observer actually fires.
  const [n, setN] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          setN(value);
          return;
        }
        setN(0);
        let start = 0;
        const animate = (t: number) => {
          if (!start) start = t;
          const p = Math.min(1, (t - start) / durationMs);
          const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
          setN(value * eased);
          if (p < 1) raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {n.toLocaleString("en-IN", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
