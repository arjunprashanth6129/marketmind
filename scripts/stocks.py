"""Canonical 35-stock universe for the NSE Time Capsule project.

Single source of truth for the data-fetch scripts. The TypeScript app mirrors
this in lib/stocks.ts. `id` is the app-internal ticker (used as JSON keys and in
dropdowns); `yahoo` is the Yahoo Finance symbol; `sector` drives peer grouping.
"""

# id, yahoo, name, sector
STOCKS = [
    ("TCS",        "TCS.NS",         "Tata Consultancy Services", "IT"),
    ("INFY",       "INFY.NS",        "Infosys",                   "IT"),
    ("HCLTECH",    "HCLTECH.NS",     "HCL Technologies",          "IT"),
    ("HDFCBANK",   "HDFCBANK.NS",    "HDFC Bank",                 "Banking"),
    ("ICICIBANK",  "ICICIBANK.NS",   "ICICI Bank",                "Banking"),
    ("KOTAKBANK",  "KOTAKBANK.NS",   "Kotak Mahindra Bank",       "Banking"),
    ("YESBANK",    "YESBANK.NS",     "Yes Bank",                  "Banking"),
    ("BAJFINANCE", "BAJFINANCE.NS",  "Bajaj Finance",             "NBFC"),
    ("HINDUNILVR", "HINDUNILVR.NS",  "Hindustan Unilever",        "FMCG Large"),
    ("ITC",        "ITC.NS",         "ITC",                       "FMCG Large"),
    ("NESTLEIND",  "NESTLEIND.NS",   "Nestle India",              "FMCG Large"),
    ("BRITANNIA",  "BRITANNIA.NS",   "Britannia Industries",      "FMCG Large"),
    ("MARICO",     "MARICO.NS",      "Marico",                    "FMCG Large"),
    ("VSTIND",     "VSTIND.NS",      "VST Industries",            "FMCG Small"),
    ("TITAN",      "TITAN.NS",       "Titan Company",             "Consumer"),
    ("ASIANPAINT", "ASIANPAINT.NS",  "Asian Paints",              "Consumer"),
    ("PAGEIND",    "PAGEIND.NS",     "Page Industries",           "Consumer"),
    ("SUNPHARMA",  "SUNPHARMA.NS",   "Sun Pharmaceutical",        "Pharma Large"),
    ("CIPLA",      "CIPLA.NS",       "Cipla",                     "Pharma Large"),
    ("DRREDDY",    "DRREDDY.NS",     "Dr. Reddy's Laboratories",  "Pharma Large"),
    ("DIVISLAB",   "DIVISLAB.NS",    "Divi's Laboratories",       "Pharma Large"),
    ("TORNTPHARM", "TORNTPHARM.NS",  "Torrent Pharmaceuticals",   "Pharma Mid"),
    ("MARUTI",     "MARUTI.NS",      "Maruti Suzuki India",       "Auto"),
    ("BAJAJAUTO",  "BAJAJ-AUTO.NS",  "Bajaj Auto",                "Auto"),
    ("LT",         "LT.NS",          "Larsen & Toubro",           "Capital Goods"),
    ("ABB",        "ABB.NS",         "ABB India",                 "Capital Goods"),
    ("GRINDWELL",  "GRINDWELL.NS",   "Grindwell Norton",          "Industrial"),
    ("POLYCAB",    "POLYCAB.NS",     "Polycab India",             "Pipes/Plastics"),
    ("SUPREMEIND", "SUPREMEIND.NS",  "Supreme Industries",        "Pipes/Plastics"),
    ("FINOLEXIND", "FINPIPE.NS",     "Finolex Industries",        "Pipes/Plastics"),
    ("GHCL",       "GHCL.NS",        "GHCL",                      "Specialty Chem"),
    ("CONCOR",     "CONCOR.NS",      "Container Corporation of India", "Logistics"),
    ("POWERGRID",  "POWERGRID.NS",   "Power Grid Corporation",    "Utilities PSU"),
    ("NTPC",       "NTPC.NS",        "NTPC",                      "Utilities PSU"),
    ("BHARTIARTL", "BHARTIARTL.NS",  "Bharti Airtel",             "Telecom"),
    ("IDEA",       "IDEA.NS",        "Vodafone Idea",             "Telecom"),
    ("ZEEL",       "ZEEL.NS",        "Zee Entertainment",         "Media"),
    ("TATASTEEL",  "TATASTEEL.NS",   "Tata Steel",                "Metals/Energy"),
    ("COALINDIA",  "COALINDIA.NS",   "Coal India",                "Metals/Energy"),
    ("IOC",        "IOC.NS",         "Indian Oil Corporation",    "Metals/Energy"),
]

NIFTY = ("NIFTY50", "^NSEI", "Nifty 50", "Index")

START = "2000-01-01"
# Fixed reproducible window end. June 2026 is the anchor "present" for the project.
END = "2026-06-30"
