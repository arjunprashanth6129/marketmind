// Canonical 40-stock universe. Mirrors scripts/stocks.py.
// `id` is the app ticker (JSON key + dropdown value); `sector` drives peers.
// NOTE: the UI never flags a stock as "good" or "bad" — students must read the
// fundamentals themselves. (6 of the 40 are deliberate weak picks.)

export interface StockMeta {
  id: string;
  name: string;
  sector: string;
}

export const STOCKS: StockMeta[] = [
  { id: "TCS", name: "Tata Consultancy Services", sector: "IT" },
  { id: "INFY", name: "Infosys", sector: "IT" },
  { id: "HCLTECH", name: "HCL Technologies", sector: "IT" },
  { id: "HDFCBANK", name: "HDFC Bank", sector: "Banking" },
  { id: "ICICIBANK", name: "ICICI Bank", sector: "Banking" },
  { id: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banking" },
  { id: "YESBANK", name: "Yes Bank", sector: "Banking" },
  { id: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC" },
  { id: "HINDUNILVR", name: "Hindustan Unilever", sector: "FMCG Large" },
  { id: "ITC", name: "ITC", sector: "FMCG Large" },
  { id: "NESTLEIND", name: "Nestle India", sector: "FMCG Large" },
  { id: "BRITANNIA", name: "Britannia Industries", sector: "FMCG Large" },
  { id: "MARICO", name: "Marico", sector: "FMCG Large" },
  { id: "VSTIND", name: "VST Industries", sector: "FMCG Small" },
  { id: "TITAN", name: "Titan Company", sector: "Consumer" },
  { id: "ASIANPAINT", name: "Asian Paints", sector: "Consumer" },
  { id: "PAGEIND", name: "Page Industries", sector: "Consumer" },
  { id: "SUNPHARMA", name: "Sun Pharmaceutical", sector: "Pharma Large" },
  { id: "CIPLA", name: "Cipla", sector: "Pharma Large" },
  { id: "DRREDDY", name: "Dr. Reddy's Laboratories", sector: "Pharma Large" },
  { id: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma Large" },
  { id: "TORNTPHARM", name: "Torrent Pharmaceuticals", sector: "Pharma Mid" },
  { id: "MARUTI", name: "Maruti Suzuki India", sector: "Auto" },
  { id: "BAJAJAUTO", name: "Bajaj Auto", sector: "Auto" },
  { id: "LT", name: "Larsen & Toubro", sector: "Capital Goods" },
  { id: "ABB", name: "ABB India", sector: "Capital Goods" },
  { id: "GRINDWELL", name: "Grindwell Norton", sector: "Industrial" },
  { id: "POLYCAB", name: "Polycab India", sector: "Pipes/Plastics" },
  { id: "SUPREMEIND", name: "Supreme Industries", sector: "Pipes/Plastics" },
  { id: "FINOLEXIND", name: "Finolex Industries", sector: "Pipes/Plastics" },
  { id: "GHCL", name: "GHCL", sector: "Specialty Chem" },
  { id: "CONCOR", name: "Container Corporation of India", sector: "Logistics" },
  { id: "POWERGRID", name: "Power Grid Corporation", sector: "Utilities PSU" },
  { id: "NTPC", name: "NTPC", sector: "Utilities PSU" },
  { id: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom" },
  { id: "IDEA", name: "Vodafone Idea", sector: "Telecom" },
  { id: "ZEEL", name: "Zee Entertainment", sector: "Media" },
  { id: "TATASTEEL", name: "Tata Steel", sector: "Metals/Energy" },
  { id: "COALINDIA", name: "Coal India", sector: "Metals/Energy" },
  { id: "IOC", name: "Indian Oil Corporation", sector: "Metals/Energy" },
];

// Display order of sectors on the landing page / filters.
export const SECTOR_ORDER = [
  "IT",
  "Banking",
  "NBFC",
  "FMCG Large",
  "FMCG Small",
  "Consumer",
  "Pharma Large",
  "Pharma Mid",
  "Auto",
  "Capital Goods",
  "Industrial",
  "Pipes/Plastics",
  "Specialty Chem",
  "Logistics",
  "Utilities PSU",
  "Metals/Energy",
  "Telecom",
  "Media",
];

const BY_ID = new Map(STOCKS.map((s) => [s.id, s]));
export const STOCK_IDS = STOCKS.map((s) => s.id);

export function getStockMeta(id: string): StockMeta | undefined {
  return BY_ID.get(id);
}

export function stocksInSector(sector: string): StockMeta[] {
  return STOCKS.filter((s) => s.sector === sector);
}

// Peers = other stocks in the same sector (restricted to our universe).
export function getPeerIds(id: string): string[] {
  const meta = BY_ID.get(id);
  if (!meta) return [];
  return STOCKS.filter((s) => s.sector === meta.sector && s.id !== id).map(
    (s) => s.id,
  );
}

export function hasNoPeers(id: string): boolean {
  return getPeerIds(id).length === 0;
}

// Custom note for standalone (single-member-sector) stocks.
const PEER_NOTE: Record<string, string> = {
  TORNTPHARM:
    "No direct mid-cap pharma peer in this list — compare against the large-cap pharma names (Sun Pharma, Cipla, Dr Reddy's, Divi's).",
};
export function peerNote(id: string): string {
  return PEER_NOTE[id] ?? "No direct peer in this list.";
}
