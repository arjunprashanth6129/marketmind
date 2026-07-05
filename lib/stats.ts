// Shared project metadata + headline stats (client-safe, no secrets).
export const PROJECT = {
  name: "MarketMind",
  tagline: "Financial Literacy Simulator",
  description:
    "A full-stack backtesting simulator that teaches fundamental analysis through hands-on portfolio construction - built on verified NSE historical data.",
  github: "https://github.com/arjunprashanth6129/marketmind",
  live: "https://nse-time-capsule.vercel.app",
  author: "Arjun",
  niftyReturn: 53.7, // verified Nifty 50 return, Jun 2021 -> Jun 2026
};

export interface Stat {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  label: string;
}

export const STATS: Stat[] = [
  { value: 50, label: "NSE stocks" },
  { value: 7, label: "yrs of financials / stock" },
  { value: 25, label: "yrs of price history" },
  { value: 10, label: "FA metrics / stock" },
  { value: 5, label: "investor scenarios" },
  { value: 1, label: "live teaching session" },
];
