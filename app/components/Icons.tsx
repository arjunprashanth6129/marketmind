/*
  Icon set. All icons share a 24x24 viewBox, 1.5 stroke, round caps/joins, and
  inherit `currentColor` so they never need a colour prop. Drawn in the Lucide
  idiom for a consistent optical weight.

  Icons are decorative wherever they sit next to a text label, so they carry
  aria-hidden and the label does the talking for screen readers.
*/

type IconProps = { className?: string };

function Svg({
  className = "h-5 w-5",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Candlestick / market data. */
export const IconCandles = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3v3m0 12v3M7 6h0a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    <path d="M17 6v2m0 8v2M17 8h0a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2Z" />
  </Svg>
);

/** Clock / time window, used for the backtest engine. */
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

/** Scales / dual scoring. */
export const IconScale = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v16M7 20h10" />
    <path d="M5 8h14M5 8l-2.5 5a3 3 0 0 0 5 0L5 8Zm14 0-2.5 5a3 3 0 0 0 5 0L19 8Z" />
    <path d="M12 4.5 5 8m7-3.5L19 8" />
  </Svg>
);

/** People / investor scenarios. */
export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
    <circle cx="8.5" cy="7" r="3.5" />
    <path d="M22 20v-1.5a4 4 0 0 0-3-3.87M16 3.63a4 4 0 0 1 0 6.74" />
  </Svg>
);

/** Trending line, for performance figures. */
export const IconTrend = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 16 5.5-5.5 3.5 3.5L21 5" />
    <path d="M15 5h6v6" />
  </Svg>
);

/** Lock, for the host-gated simulator. */
export const IconLock = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="10.5" width="16" height="10.5" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </Svg>
);

/** Database / static data layer. */
export const IconDatabase = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6" rx="7.5" ry="3" />
    <path d="M4.5 6v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" />
    <path d="M4.5 12v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" />
  </Svg>
);

/** Terminal, for the Python pipeline. */
export const IconTerminal = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="m7.5 9.5 2.5 2.5-2.5 2.5M13 15h4" />
  </Svg>
);

/** Layers, for the frontend layer. */
export const IconLayers = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
    <path d="m3 12.5 9 4.5 9-4.5M3 17l9 4.5L21 17" />
  </Svg>
);

/** Shield check, for verification / rigor. */
export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3 5 6v5.5c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

/** Arrow right, for links and CTAs. */
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

/** Search / filter input affordance. */
export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);

/** GitHub mark. Solid fill (official mark shape), not a stroke icon. */
export const IconGitHub = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.41.35.78 1.05.78 2.12v3.14c0 .31.2.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
  </svg>
);

/** Wordmark glyph used in the header lockup. */
export const IconLogo = ({ className = "h-full w-full" }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M4 17.5 9 11l3.5 3.5L20 6"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="11" r="1.6" fill="currentColor" />
    <circle cx="12.5" cy="14.5" r="1.6" fill="currentColor" />
  </svg>
);
