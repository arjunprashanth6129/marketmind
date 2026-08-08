// Canonical 100-stock universe - the verified time-capsule list
// (40 "good fundamentals" + 10 deliberate weak picks, all NSE, June 2021).
// `id` is the app ticker (JSON key + dropdown value); `sector` drives peers.
// NOTE: the UI never flags a stock as "good" or "bad" - students must read the
// fundamentals themselves.

export interface StockMeta {
  id: string;
  name: string;
  sector: string;
}

export const STOCKS: StockMeta[] = [
  // --- Banks ---
  { id: "HDFCBANK", name: "HDFC Bank", sector: "Banks" },
  { id: "KOTAKBANK", name: "Kotak Mahindra Bank", sector: "Banks" },
  { id: "AXISBANK", name: "Axis Bank", sector: "Banks" },
  // --- NBFC/Financial Services ---
  { id: "BAJAJFINSV", name: "Bajaj Finserv", sector: "NBFC/Financial Services" },
  { id: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC/Financial Services" },
  { id: "SUNDARMFIN", name: "Sundaram Finance", sector: "NBFC/Financial Services" },
  { id: "AAVAS", name: "Aavas Financiers", sector: "NBFC/Financial Services" },
  // --- IT Services ---
  { id: "CYIENT", name: "Cyient", sector: "IT Services" },
  { id: "MPHASIS", name: "Mphasis", sector: "IT Services" },
  { id: "HCLTECH", name: "HCL Technologies", sector: "IT Services" },
  { id: "TECHM", name: "Tech Mahindra", sector: "IT Services" },
  { id: "ZENSARTECH", name: "Zensar Technologies", sector: "IT Services" },
  { id: "COFORGE", name: "Coforge", sector: "IT Services" },
  { id: "INFY", name: "Infosys", sector: "IT Services" },
  { id: "WIPRO", name: "Wipro", sector: "IT Services" },
  // --- Pharma/Biotech ---
  { id: "BIOCON", name: "Biocon", sector: "Pharma/Biotech" },
  { id: "DRREDDY", name: "Dr. Reddy's Laboratories", sector: "Pharma/Biotech" },
  { id: "CIPLA", name: "Cipla", sector: "Pharma/Biotech" },
  { id: "DIVISLAB", name: "Divi's Laboratories", sector: "Pharma/Biotech" },
  // --- FMCG ---
  { id: "GODREJCP", name: "Godrej Consumer Products", sector: "FMCG" },
  { id: "COLPAL", name: "Colgate-Palmolive (India)", sector: "FMCG" },
  { id: "JYOTHYLAB", name: "Jyothy Labs", sector: "FMCG" },
  { id: "BRITANNIA", name: "Britannia Industries", sector: "FMCG" },
  { id: "TATACONSUM", name: "Tata Consumer Products", sector: "FMCG" },
  { id: "MARICO", name: "Marico", sector: "FMCG" },
  { id: "NESTLEIND", name: "Nestle India", sector: "FMCG" },
  { id: "ITC", name: "ITC", sector: "FMCG" },
  // --- Beverages ---
  { id: "VBL", name: "Varun Beverages", sector: "Beverages" },
  // --- Auto ---
  { id: "TATAMOTORS", name: "Tata Motors", sector: "Auto" },
  // --- Consumer Durables ---
  { id: "HAVELLS", name: "Havells India", sector: "Consumer Durables" },
  { id: "VOLTAS", name: "Voltas", sector: "Consumer Durables" },
  // --- Industrials/Building Materials ---
  { id: "ASTRAL", name: "Astral", sector: "Industrials/Building Materials" },
  { id: "KAJARIACER", name: "Kajaria Ceramics", sector: "Industrials/Building Materials" },
  { id: "AMBUJACEM", name: "Ambuja Cements", sector: "Industrials/Building Materials" },
  { id: "CERA", name: "Cera Sanitaryware", sector: "Industrials/Building Materials" },
  { id: "SUPREMEIND", name: "Supreme Industries", sector: "Industrials/Building Materials" },
  { id: "GRINDWELL", name: "Grindwell Norton", sector: "Industrials/Building Materials" },
  // --- Energy/Oil & Gas ---
  { id: "RELIANCE", name: "Reliance Industries", sector: "Energy/Oil & Gas" },
  { id: "BPCL", name: "Bharat Petroleum", sector: "Energy/Oil & Gas" },
  // --- Power/Utilities ---
  { id: "ADANIGREEN", name: "Adani Green Energy", sector: "Power/Utilities" },
  { id: "RPOWER", name: "Reliance Power", sector: "Power/Utilities" },
  // --- Gas Distribution ---
  { id: "GUJGASLTD", name: "Gujarat Gas", sector: "Gas Distribution" },
  { id: "IGL", name: "Indraprastha Gas", sector: "Gas Distribution" },
  // --- Specialty Chemicals ---
  { id: "AARTIIND", name: "Aarti Industries", sector: "Specialty Chemicals" },
  // --- Textiles ---
  { id: "GARFIBRES", name: "Garware Technical Fibres", sector: "Textiles" },
  // --- Jewellery ---
  { id: "RAJESHEXPO", name: "Rajesh Exports", sector: "Jewellery" },
  // --- Footwear ---
  { id: "RELAXO", name: "Relaxo Footwears", sector: "Footwear" },
  // --- Media ---
  { id: "ZEEL", name: "Zee Entertainment", sector: "Media" },
  // --- Infra/Cement ---
  { id: "JPASSOCIAT", name: "Jaiprakash Associates", sector: "Infra/Cement" },
  // --- Fintech ---
  { id: "PAYTM", name: "Paytm (One97 Communications)", sector: "Fintech" },

  // ===== Phase 2 expansion (50 added) =====
  // Half were small caps at the June-2021 anchor; see the methodology.
  // Cap labels live in data/snapshot-2021.json, computed from June-2021
  // market cap, not asserted here.
  // --- Auto Components ---
  { id: "BALKRISIND", name: "Balkrishna Industries", sector: "Auto Components" },
  { id: "BOSCHLTD", name: "Bosch", sector: "Auto Components" },
  { id: "GABRIEL", name: "Gabriel India", sector: "Auto Components" },
  { id: "JAMNAAUTO", name: "Jamna Auto Industries", sector: "Auto Components" },
  { id: "LUMAXIND", name: "Lumax Industries", sector: "Auto Components" },
  { id: "MINDACORP", name: "Minda Corporation", sector: "Auto Components" },
  { id: "SUPRAJIT", name: "Suprajit Engineering", sector: "Auto Components" },
  // --- Banks ---
  { id: "DCBBANK", name: "DCB Bank", sector: "Banks" },
  { id: "FEDERALBNK", name: "Federal Bank", sector: "Banks" },
  { id: "KARURVYSYA", name: "Karur Vysya Bank", sector: "Banks" },
  // --- Beverages ---
  { id: "CCL", name: "CCL Products (India)", sector: "Beverages" },
  // --- Cables & Wires ---
  { id: "KEI", name: "KEI Industries", sector: "Cables & Wires" },
  { id: "POLYCAB", name: "Polycab India", sector: "Cables & Wires" },
  // --- Consumer Durables ---
  { id: "IFBIND", name: "IFB Industries", sector: "Consumer Durables" },
  // --- Electronics Manufacturing ---
  { id: "AMBER", name: "Amber Enterprises India", sector: "Electronics Manufacturing" },
  { id: "DIXON", name: "Dixon Technologies (India)", sector: "Electronics Manufacturing" },
  // --- Engineering & Capital Goods ---
  { id: "KIRLOSENG", name: "Kirloskar Oil Engines", sector: "Engineering & Capital Goods" },
  { id: "THERMAX", name: "Thermax", sector: "Engineering & Capital Goods" },
  { id: "ZENTEC", name: "Zen Technologies", sector: "Engineering & Capital Goods" },
  // --- FMCG ---
  { id: "BAJAJCON", name: "Bajaj Consumer Care", sector: "FMCG" },
  { id: "HERITGFOOD", name: "Heritage Foods", sector: "FMCG" },
  // --- Fertilizers & Agrochem ---
  { id: "DEEPAKFERT", name: "Deepak Fertilisers & Petrochemicals", sector: "Fertilizers & Agrochem" },
  // --- Hospitality & QSR ---
  { id: "INDHOTEL", name: "The Indian Hotels Company", sector: "Hospitality & QSR" },
  { id: "JUBLFOOD", name: "Jubilant FoodWorks", sector: "Hospitality & QSR" },
  // --- IT Services ---
  { id: "KPITTECH", name: "KPIT Technologies", sector: "IT Services" },
  { id: "LTTS", name: "L&T Technology Services", sector: "IT Services" },
  { id: "NEWGEN", name: "Newgen Software Technologies", sector: "IT Services" },
  { id: "PERSISTENT", name: "Persistent Systems", sector: "IT Services" },
  { id: "TANLA", name: "Tanla Platforms", sector: "IT Services" },
  { id: "TATAELXSI", name: "Tata Elxsi", sector: "IT Services" },
  // --- Industrials/Building Materials ---
  { id: "GREENPANEL", name: "Greenpanel Industries", sector: "Industrials/Building Materials" },
  { id: "NILKAMAL", name: "Nilkamal", sector: "Industrials/Building Materials" },
  // --- Media ---
  { id: "SANDESH", name: "The Sandesh", sector: "Media" },
  // --- Metals & Recycling ---
  { id: "GRAVITA", name: "Gravita India", sector: "Metals & Recycling" },
  // --- NBFC/Financial Services ---
  { id: "CHOLAFIN", name: "Cholamandalam Investment & Finance", sector: "NBFC/Financial Services" },
  { id: "MANAPPURAM", name: "Manappuram Finance", sector: "NBFC/Financial Services" },
  { id: "MUTHOOTFIN", name: "Muthoot Finance", sector: "NBFC/Financial Services" },
  { id: "REPCOHOME", name: "Repco Home Finance", sector: "NBFC/Financial Services" },
  // --- Pharma/Biotech ---
  { id: "AJANTPHARM", name: "Ajanta Pharma", sector: "Pharma/Biotech" },
  { id: "ALKEM", name: "Alkem Laboratories", sector: "Pharma/Biotech" },
  { id: "LAURUSLABS", name: "Laurus Labs", sector: "Pharma/Biotech" },
  { id: "TORNTPHARM", name: "Torrent Pharmaceuticals", sector: "Pharma/Biotech" },
  // --- Specialty Chemicals ---
  { id: "APCOTEXIND", name: "Apcotex Industries", sector: "Specialty Chemicals" },
  { id: "NAVINFLUOR", name: "Navin Fluorine International", sector: "Specialty Chemicals" },
  { id: "NOCIL", name: "NOCIL", sector: "Specialty Chemicals" },
  { id: "SRF", name: "SRF", sector: "Specialty Chemicals" },
  // --- Textiles ---
  { id: "ARVIND", name: "Arvind", sector: "Textiles" },
  { id: "HIMATSEIDE", name: "Himatsingka Seide", sector: "Textiles" },
  { id: "PAGEIND", name: "Page Industries", sector: "Textiles" },
  { id: "RAYMOND", name: "Raymond", sector: "Textiles" },
];

// Display order of sectors on the landing page / filters.
export const SECTOR_ORDER = [
  "Banks",
  "NBFC/Financial Services",
  "IT Services",
  "Pharma/Biotech",
  "FMCG",
  "Beverages",
  "Auto",
  "Consumer Durables",
  "Industrials/Building Materials",
  "Auto Components",
  "Electronics Manufacturing",
  "Cables & Wires",
  "Engineering & Capital Goods",
  "Metals & Recycling",
  "Energy/Oil & Gas",
  "Power/Utilities",
  "Gas Distribution",
  "Specialty Chemicals",
  "Textiles",
  "Jewellery",
  "Footwear",
  "Media",
  "Infra/Cement",
  "Fertilizers & Agrochem",
  "Hospitality & QSR",
  "Fintech",
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
  VBL: "No other listed beverages bottler in this universe - read Varun Beverages against the broader FMCG names for a consumer-staples reference.",
  TATAMOTORS:
    "No other automaker in this list - Tata Motors is the only Auto-sector name in this universe.",
  GARFIBRES:
    "No direct technical-textiles peer in this list - compare against the broader industrials/building-materials names.",
  AARTIIND:
    "No other specialty-chemicals name in this list - judge on its own FY2021 fundamentals.",
  RAJESHEXPO: "No other jewellery name in this list.",
  RELAXO: "No other footwear name in this list.",
  ZEEL: "No other media name in this list.",
  JPASSOCIAT: "No other infrastructure/cement name in this list.",
  PAYTM: "No other fintech name in this list.",
};
export function peerNote(id: string): string {
  return PEER_NOTE[id] ?? "No direct peer in this list.";
}
