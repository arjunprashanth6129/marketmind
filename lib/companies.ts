// Neutral, factual "About the company" write-ups for each stock.
// Describe the business, its sector position, and the metrics/drivers an
// informed investor watches. Tone and length are kept consistent across ALL 40
// stocks — the screener never flags a company as a good or bad pick.

export const COMPANY_ABOUT: Record<string, string> = {
  TCS:
    "India's largest IT-services exporter and a Tata Group flagship, providing software development, consulting and outsourcing to global enterprises. Revenue is largely USD-billed, so results move with global tech spending, large-deal wins, wage inflation and the rupee. Known for high return ratios, an asset-light model and regular dividends and buybacks.",
  INFY:
    "India's second-largest IT-services firm, focused on digital transformation, cloud and consulting for global clients. Like its peers it is an export model; investors track revenue-growth guidance, operating margins, large-deal bookings and employee attrition.",
  HCLTECH:
    "A large Indian IT company with a distinctive mix of infrastructure-management services and engineering/R&D services, plus a software-products portfolio. More exposed to ER&D and products than most peers; watched for services growth and margins.",
  HDFCBANK:
    "India's largest private-sector bank by assets, built on a retail-led lending franchise with a long record of steady growth. For any bank the key metrics are net interest margin (NIM), deposit/CASA growth and asset quality (NPAs). Merged with its parent HDFC Ltd in 2023.",
  ICICIBANK:
    "A large private-sector bank offering retail and corporate lending, with major insurance, securities and AMC subsidiaries. Investors focus on NIM, credit costs, CASA deposits and the performance of its listed subsidiaries.",
  KOTAKBANK:
    "A conservatively run, high-margin private bank with a strong low-cost deposit (CASA) franchise, anchoring a broader financial-services group spanning broking, asset management and insurance.",
  BAJFINANCE:
    "One of India's largest non-bank lenders (NBFC), focused on consumer-durable, personal and SME financing with a very large customer base. NBFCs are judged on loan growth, net interest margins, cost of funds and credit costs, and structurally run higher leverage than manufacturers.",
  HINDUNILVR:
    "India's largest FMCG company (a Unilever subsidiary), spanning home care, personal care and foods with deep nationwide distribution. A defensive, high-ROE compounder; volume growth, rural demand and input-cost inflation (palm oil, crude derivatives) drive margins.",
  ITC:
    "A diversified conglomerate whose cigarette business is the main profit engine, alongside FMCG foods, hotels, paperboards and agri-business. Cash-rich and a high dividend payer; cigarette taxation and regulation are key swing factors.",
  NESTLEIND:
    "The Indian arm of Nestlé, selling packaged foods and beverages (Maggi, dairy, chocolates, infant nutrition) behind strong brands with pricing power. Defensive and high-ROE; watch volume growth and commodity costs (milk, cocoa, coffee, wheat).",
  BRITANNIA:
    "A leading biscuits and bakery/dairy company with powerful brands and distribution reach. A defensive FMCG profile whose margins are sensitive to wheat, palm oil and packaging costs; growth comes from premiumisation and adjacency expansion.",
  MARICO:
    "An FMCG company built on hair oils (Parachute), edible oils (Saffola) and a growing foods and premium personal-care portfolio. Gross margins move with copra and edible-oil prices; investors watch the shift toward higher-margin foods and digital-first brands.",
  VSTIND:
    "A mid/small-cap cigarette maker (an associate of BAT) concentrated in the value segment in south and east India. Generates steady cash flows and dividends, and like all tobacco is regulated and tax-sensitive.",
  TITAN:
    "A Tata Group consumer-discretionary leader whose branded jewellery business (Tanishq) dominates revenue, alongside watches and eyewear. Demand tracks gold prices, weddings and festivals, and the long shift from unorganised to organised retail.",
  ASIANPAINT:
    "India's largest paints company, with dominant market share and an extensive dealer and tinting network. Decorative paints drive earnings; results are sensitive to crude-linked raw-material costs and to housing and renovation demand. Historically a high-ROE franchise.",
  PAGEIND:
    "The exclusive Indian licensee of Jockey innerwear and Speedo swimwear — a premium, high-margin apparel business carrying a very high per-share price. Growth is tied to retail expansion and premiumisation; investors watch inventory and same-store trends.",
  SUNPHARMA:
    "India's largest pharmaceutical company, combining a growing specialty franchise (e.g. dermatology) with generics across the US, India and emerging markets. Pharma earnings hinge on US generic pricing, specialty launches and FDA/regulatory compliance.",
  CIPLA:
    "A major drugmaker strong in respiratory therapies and India branded generics, with meaningful US and emerging-market businesses. Investors track the US pipeline, the India franchise and regulatory-inspection outcomes.",
  DRREDDY:
    "A global generics-led pharma company with significant US exposure and an active API business. Earnings are driven by US generic launches and pricing, cost control and regulatory standing.",
  DIVISLAB:
    "One of the world's largest makers of active pharmaceutical ingredients (APIs) and custom synthesis for global innovator companies. A high-margin, capacity-led business with some product and customer concentration; capex cycles and global outsourcing trends matter.",
  TORNTPHARM:
    "A branded-generics-focused pharma company strong in India and Brazil chronic-therapy segments, with a higher India/branded mix than pure exporters. Growth comes from field-force productivity, new launches and acquisitions.",
  MARUTI:
    "India's largest passenger-car maker (a Suzuki subsidiary) with leading market share, historically strongest in small cars. Volumes are cyclical with the economy; investors watch rural demand, the model mix (the shift toward SUVs), discounting and input/forex costs.",
  BAJAJAUTO:
    "A leading two- and three-wheeler maker with a strong export franchise and premium-motorcycle brands (Pulsar, plus the KTM partnership). High-margin, cash-rich and dividend-paying; exports and domestic 2W/3W demand are the key drivers.",
  LT:
    "Larsen & Toubro, India's largest engineering and construction conglomerate, also spanning IT services (LTIMindtree, LTTS), defence and infrastructure. A proxy for the domestic capex/infrastructure cycle; order book, execution pace and working capital are closely watched.",
  ABB:
    "The Indian arm of ABB, supplying electrification, motion and automation products to industry and infrastructure. A beneficiary of the industrial-capex and automation cycle; reports on a December fiscal year, and order inflows and margins are the key metrics.",
  GRINDWELL:
    "Grindwell Norton (Saint-Gobain group), a maker of abrasives and ceramics/silicon-carbide products for industrial use. A steady industrial-consumables play tied to manufacturing activity, with high return ratios and low debt.",
  POLYCAB:
    "India's largest wires & cables manufacturer, expanding into FMEG (fans, lighting, switches and appliances). A beneficiary of construction, infrastructure and electrification; results are sensitive to copper/aluminium costs and to the B2C FMEG ramp. Listed in 2019.",
  SUPREMEIND:
    "A diversified plastics processor across piping systems, packaging, industrial and consumer products. Plumbing/agri pipes drive volumes; earnings are sensitive to PVC and polymer prices and to construction demand, with consistent cash generation.",
  FINOLEXIND:
    "Finolex Industries (screener/Yahoo symbol FINPIPE), a leading maker of PVC pipes and fittings that is backward-integrated into PVC resin. Earnings swing with PVC-resin spreads and with agricultural and housing demand.",
  FINEORG:
    "Fine Organic Industries, India's largest producer of oleochemical-based specialty additives used in foods, plastics and cosmetics. A niche, export-oriented, high-promoter business whose margins move with vegetable-oil feedstock costs. Listed in 2018.",
  CONCOR:
    "Container Corporation of India, a government-owned rail-container logistics operator running a national network of inland container depots. Volumes track EXIM and domestic trade and rail-freight policy; government ownership and possible disinvestment are watched.",
  POWERGRID:
    "The state-controlled monopoly operator of India's inter-state electricity transmission grid. A largely regulated, annuity-like business with stable returns and high dividends; growth depends on new transmission-capex awards.",
  NTPC:
    "India's largest power generator (state-controlled), predominantly coal-based and expanding into renewables. A regulated return-on-equity model gives stable cash flows and dividends; investors watch capacity additions and the pace of the green-energy pivot.",
  BHARTIARTL:
    "Bharti Airtel, one of India's two largest private telecom operators, with a sizeable Africa business and home/enterprise services. Telecom is capital-intensive; the key metrics are subscribers, ARPU (average revenue per user), spectrum and debt. FY2021 results carried AGR-related provisions.",
  IDEA:
    "Vodafone Idea, the joint venture of Vodafone Group and Aditya Birla and India's third private telecom operator. Telecom is highly capital-intensive; the company carries a large debt and statutory (AGR/spectrum) dues burden, and subscriber trends, ARPU and fund-raising are closely watched.",
  ZEEL:
    "Zee Entertainment, one of India's largest television broadcasters, with a deep content library and the ZEE5 streaming platform. Advertising revenue is cyclical with the economy; promoter holding and corporate-governance/board matters have been investor focal points.",
  TATASTEEL:
    "Tata Steel, an integrated steel producer with large operations in India and Europe. Steel is a global commodity, so earnings are highly cyclical with steel prices and input costs (iron ore, coking coal); leverage and capacity utilisation are key considerations.",
  COALINDIA:
    "Coal India, the state-controlled, near-monopoly supplier of India's thermal coal. A high dividend payer whose volumes track power demand; government majority ownership influences pricing, and the long-term energy transition is a structural consideration.",
  IOC:
    "Indian Oil Corporation, a state-owned refining and fuel-marketing major. Earnings are driven by refining margins (GRMs) and marketing margins, both sensitive to crude prices and to government fuel-pricing policy. A large dividend payer.",
};

export function getCompanyAbout(id: string): string | undefined {
  return COMPANY_ABOUT[id];
}
