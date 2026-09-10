export type Exchange = "ngx" | "us";

export type MarketDataProvider = "yahoofinance" | "ngnmarket" | "koboterminal" | "oanor" | "finnhub";

export interface MarketQuote {
  symbol: string;
  companyName: string;
  exchange: Exchange;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  sector: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

export interface MarketDataError {
  code:
    | "NO_API_KEY"
    | "INVALID_SYMBOL"
    | "RATE_LIMITED"
    | "PROVIDER_ERROR"
    | "NO_DATA"
    | "UNKNOWN";
  message: string;
  provider?: Exchange;
}

export type MarketDataResult =
  | { ok: true; data: MarketQuote }
  | { ok: false; error: MarketDataError };
