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
  { value: 100, label: "NSE stocks" },
  { value: 50, label: "small caps in 2021" },
  { value: 7, label: "yrs of financials / stock" },
  { value: 10, label: "FA metrics / stock" },
  { value: 5, label: "investor scenarios" },
  { value: 1, label: "live teaching session" },
];
