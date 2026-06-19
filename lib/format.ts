// Display formatting helpers (Indian conventions).

const inGroup = new Intl.NumberFormat("en-IN");
const inGroup2 = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const DASH = "—";

export function naDash<T>(v: T | null | undefined): boolean {
  return v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));
}

// ₹ price like ₹1,276.55
export function rupee(v: number | null | undefined): string {
  if (naDash(v)) return DASH;
  return "₹" + inGroup2.format(v as number);
}

// Whole-number ₹ crore with Indian grouping: ₹5,03,797 Cr
export function crore(v: number | null | undefined): string {
  if (naDash(v)) return DASH;
  return "₹" + inGroup.format(Math.round(v as number)) + " Cr";
}

// Compact crore for chips: ₹5.04L Cr / ₹2,907 Cr
export function croreCompact(v: number | null | undefined): string {
  if (naDash(v)) return DASH;
  const n = v as number;
  if (n >= 100000) return "₹" + (n / 100000).toFixed(2) + "L Cr";
  return "₹" + inGroup.format(Math.round(n)) + " Cr";
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (naDash(v)) return DASH;
  return (v as number).toFixed(digits) + "%";
}

// Signed percent for returns: +123.4% / -12.0%
export function pctSigned(v: number | null | undefined, digits = 1): string {
  if (naDash(v)) return DASH;
  const n = v as number;
  return (n >= 0 ? "+" : "") + n.toFixed(digits) + "%";
}

export function num(v: number | null | undefined, digits = 2): string {
  if (naDash(v)) return DASH;
  return inGroup.format(
    Number((v as number).toFixed(digits)),
  );
}

export function ratio(v: number | null | undefined, digits = 2): string {
  if (naDash(v)) return DASH;
  return (v as number).toFixed(digits);
}

// "2021-06-01" -> "Jun 2021"
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
}
