import type {
  Exchange,
  MarketQuote,
  MarketDataResult,
  MarketDataError,
} from "@/types/investment";
import { US_STOCKS } from "@/lib/stocks-data";

// -----------------------------------------------------------------------------
// Provider adapters
//
// US equities: Yahoo Finance v8 chart (primary) → Finnhub (fallback).
// NGX equities: Kobo Terminal (primary) → NGN Market → Oanor.
//
// After fetching from a primary provider, we try secondary providers to fill
// any null fields (P/E, 52-week, market cap, etc.). This merge strategy
// ensures we get the richest possible data set.
// -----------------------------------------------------------------------------

const PROVIDER_FETCH_TIMEOUT_MS = 10_000;

async function fetchJson<T>(
  url: string,
  headers: Record<string, string>,
  exchange: Exchange
): Promise<{ ok: true; data: T } | { ok: false; error: MarketDataError }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, { headers, cache: "no-store", signal: controller.signal });
  } catch {
    return {
      ok: false,
      error: {
        code: "PROVIDER_ERROR",
        message: "The market data provider could not be reached.",
        provider: exchange,
      },
    };
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error: {
        code: "NO_API_KEY",
        message: "The market data API key is missing or invalid.",
        provider: exchange,
      },
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      error: {
        code: "INVALID_SYMBOL",
        message: "We could not find that ticker.",
        provider: exchange,
      },
    };
  }

  if (res.status === 429) {
    return {
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly.",
        provider: exchange,
      },
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: {
        code: "PROVIDER_ERROR",
        message: "The market data provider returned an error.",
        provider: exchange,
      },
    };
  }

  try {
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return {
      ok: false,
      error: {
        code: "PROVIDER_ERROR",
        message: "The market data provider returned an unreadable response.",
        provider: exchange,
      },
    };
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

// -----------------------------------------------------------------------------
// Data merge — combine fields from multiple providers
//
// Takes a base quote and fills in any null fields from a secondary source.
// This lets us combine e.g. Kobo (P/E) with NGN Market (52-week) for NGX
// or Yahoo Finance (52-week) with Finnhub (market cap) for US.
// -----------------------------------------------------------------------------

function mergeQuote(base: MarketQuote, overlay: Partial<MarketQuote>): MarketQuote {
  return {
    symbol: base.symbol,
    companyName: base.companyName || overlay.companyName || base.symbol,
    exchange: base.exchange,
    currency: base.currency,
    price: base.price,
    change: base.change ?? overlay.change ?? 0,
    changePercent: base.changePercent ?? overlay.changePercent ?? 0,
    previousClose: base.previousClose ?? overlay.previousClose ?? null,
    open: base.open ?? overlay.open ?? null,
    high: base.high ?? overlay.high ?? null,
    low: base.low ?? overlay.low ?? null,
    volume: base.volume ?? overlay.volume ?? null,
    marketCap: base.marketCap ?? overlay.marketCap ?? null,
    peRatio: base.peRatio ?? overlay.peRatio ?? null,
    eps: base.eps ?? overlay.eps ?? null,
    sector: base.sector ?? overlay.sector ?? null,
    fiftyTwoWeekHigh: base.fiftyTwoWeekHigh ?? overlay.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: base.fiftyTwoWeekLow ?? overlay.fiftyTwoWeekLow ?? null,
  };
}

// Check if a quote is missing key fields that are worth filling from fallbacks.
function needsEnrichment(q: MarketQuote): boolean {
  return (
    q.peRatio === null ||
    q.fiftyTwoWeekHigh === null ||
    q.fiftyTwoWeekLow === null ||
    q.marketCap === null ||
    q.eps === null
  );
}

// -----------------------------------------------------------------------------
// Yahoo Finance v8 chart — US equities — Primary provider
//
// Direct HTTP to query2.finance.yahoo.com (no npm package needed).
// This endpoint works from regions where query1 is blocked.
// Provides: price, change, 52-week high/low, volume, prev close, company name.
// Does NOT provide: P/E, EPS, market cap (use Finnhub profile2 for those).
// -----------------------------------------------------------------------------

interface YahooChartResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        regularMarketChangePercent: number;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        regularMarketVolume: number;
        chartPreviousClose: number;
        longName: string;
        shortName: string;
      };
    }>;
  };
}

async function fetchYahooChart(symbol: string): Promise<MarketDataResult> {
  const normalized = symbol.toUpperCase();
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalized)}?range=1d&interval=1d`;

  const result = await fetchJson<YahooChartResponse>(
    url,
    { "User-Agent": "Mozilla/5.0" },
    "us"
  );

  if (!result.ok) return result;

  const meta = result.data?.chart?.result?.[0]?.meta;
  if (!meta) {
    return {
      ok: false,
      error: { code: "INVALID_SYMBOL", message: "We could not find that ticker on US markets.", provider: "us" },
    };
  }

  const price = num(meta.regularMarketPrice);
  if (price === null || price === 0) {
    return {
      ok: false,
      error: { code: "NO_DATA", message: "No price data available for that ticker.", provider: "us" },
    };
  }

  return {
    ok: true,
    data: {
      symbol: normalized,
      companyName: str(meta.longName) ?? str(meta.shortName) ?? normalized,
      exchange: "us",
      currency: str(meta.currency) ?? "USD",
      price,
      change: (() => {
        const previousClose = num(meta.chartPreviousClose);
        return previousClose === null ? 0 : price - previousClose;
      })(),
      changePercent: num(meta.regularMarketChangePercent) ?? 0,
      previousClose: num(meta.chartPreviousClose),
      open: null,
      high: num(meta.regularMarketDayHigh),
      low: num(meta.regularMarketDayLow),
      volume: num(meta.regularMarketVolume),
      marketCap: null,
      peRatio: null,
      eps: null,
      sector: null,
      fiftyTwoWeekHigh: num(meta.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: num(meta.fiftyTwoWeekLow),
    },
  };
}

// -----------------------------------------------------------------------------
// Finnhub — US equities — Fallback / enrichment provider
//
// Profile2: company name, market cap, sector, currency.
// Quote: price, change, open, high, low, prev close.
// -----------------------------------------------------------------------------

async function fetchFinnhub(symbol: string): Promise<MarketDataResult> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: { code: "NO_API_KEY", message: "US market data is not configured.", provider: "us" },
    };
  }

  const normalized = symbol.toUpperCase();
  const headers = { "X-Finnhub-Token": key };

  const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(normalized)}`;
  const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(normalized)}`;

  const [quoteRes, profileRes] = await Promise.all([
    fetchJson<Record<string, unknown>>(quoteUrl, headers, "us"),
    fetchJson<Record<string, unknown>>(profileUrl, headers, "us"),
  ]);

  if (!quoteRes.ok) return quoteRes;

  const q = quoteRes.data;
  const price = num(q.c);
  if (price === null || price === 0) {
    return {
      ok: false,
      error: { code: "NO_DATA", message: "No price data available for that ticker.", provider: "us" },
    };
  }

  let p: Record<string, unknown> = {};
  if (profileRes.ok) p = profileRes.data as Record<string, unknown>;

  return {
    ok: true,
    data: {
      symbol: normalized,
      companyName: str(p.name) ?? normalized,
      exchange: "us",
      currency: str(p.currency) ?? "USD",
      price,
      change: num(q.d) ?? 0,
      changePercent: num(q.dp) ?? 0,
      previousClose: num(q.pc),
      open: num(q.o),
      high: num(q.h),
      low: num(q.l),
      volume: null,
      marketCap: num(p.marketCapitalization) !== null ? num(p.marketCapitalization)! * price * 1_000_000 : null,
      peRatio: null,
      eps: null,
      sector: str(p.finnhubIndustry),
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
    },
  };
}

// -----------------------------------------------------------------------------
// Kobo Terminal — Nigerian Exchange (NGX) — Primary provider
//
// Free tier: 100 req/day, 10 req/min.
// GET https://koboterminal.com/api/ngxdata/stocks  (all stocks, cached)
// Has: pe_ratio, price, change%, volume, market cap, sector, previous_close.
// Missing: 52-week high/low, open, high, low.
// -----------------------------------------------------------------------------

interface KoboStock {
  symbol: string;
  name: string;
  current_price: number;
  change_percent: number;
  volume: number;
  market_cap: number | null;
  shares_outstanding: number | null;
  sector: string;
  previous_close: number;
  pe_ratio?: number | null;
}

interface KoboStocksResponse {
  success: boolean;
  stocks: KoboStock[];
  total: number;
  as_of: string;
}

let koboCache: { data: KoboStock[]; fetchedAt: number } | null = null;
const KOBO_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchKoboStocks(): Promise<KoboStock[]> {
  const key = process.env.KOBO_API_KEY;
  if (!key) return [];

  if (koboCache && Date.now() - koboCache.fetchedAt < KOBO_CACHE_TTL_MS) {
    return koboCache.data;
  }

  const url = "https://koboterminal.com/api/ngxdata/stocks";
  const result = await fetchJson<KoboStocksResponse>(
    url,
    { "X-API-Key": key, "Content-Type": "application/json" },
    "ngx"
  );

  if (!result.ok || !result.data.stocks) return [];

  koboCache = { data: result.data.stocks, fetchedAt: Date.now() };
  return result.data.stocks;
}

async function fetchKoboTerminal(symbol: string): Promise<MarketDataResult> {
  const key = process.env.KOBO_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: { code: "NO_API_KEY", message: "NGX data is not configured.", provider: "ngx" },
    };
  }

  const normalized = symbol.toUpperCase();
  const stocks = await fetchKoboStocks();
  const q = stocks.find((s) => s.symbol === normalized);

  if (!q) {
    return {
      ok: false,
      error: { code: "INVALID_SYMBOL", message: "We could not find that ticker on the NGX.", provider: "ngx" },
    };
  }

  const price = num(q.current_price);
  if (price === null || price === 0) {
    return {
      ok: false,
      error: { code: "NO_DATA", message: "No price data available for that ticker.", provider: "ngx" },
    };
  }

  const prevClose = num(q.previous_close);
  const changeFromClose = price !== null && prevClose !== null ? price - prevClose : 0;

  return {
    ok: true,
    data: {
      symbol: str(q.symbol) ?? normalized,
      companyName: str(q.name) ?? normalized,
      exchange: "ngx",
      currency: "NGN",
      price,
      change: changeFromClose,
      changePercent: num(q.change_percent) ?? 0,
      previousClose: prevClose,
      open: null,
      high: null,
      low: null,
      volume: num(q.volume),
      marketCap: num(q.market_cap),
      peRatio: num(q.pe_ratio),
      eps: null,
      sector: str(q.sector),
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
    },
  };
}

// -----------------------------------------------------------------------------
// NGN Market — Nigerian Exchange (NGX) — Enrichment provider
//
// Free tier: 3,000 calls/month.
// GET https://api.ngnmarket.com/v1/companies?limit=200
// Has: 52-week high/low, price, volume, market cap, sector.
// Missing: P/E ratio (requires Hobby plan for detail endpoint).
// We use this to fill 52-week data that Kobo lacks.
// -----------------------------------------------------------------------------

interface NgnMarketCompany {
  symbol: string;
  name: string;
  price: number;
  prev_close: number;
  day_high: number | null;
  day_low: number | null;
  volume: number;
  market_cap: number;
  price_change: number;
  price_change_percent: number;
  high_52wk: number;
  low_52wk: number;
  sector: string;
  shares_outstanding: number;
}

interface NgnMarketListResponse {
  success: boolean;
  data: {
    data: NgnMarketCompany[];
    pagination: { total: number };
  };
}

let ngnCache: { data: NgnMarketCompany[]; fetchedAt: number } | null = null;
const NGN_CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchNgnMarketCompanies(): Promise<NgnMarketCompany[]> {
  const key = process.env.NGNMARKET_API_KEY;
  if (!key) return [];

  if (ngnCache && Date.now() - ngnCache.fetchedAt < NGN_CACHE_TTL_MS) {
    return ngnCache.data;
  }

  const url = "https://api.ngnmarket.com/v1/companies?limit=200&sort=market_cap&order=desc";
  const result = await fetchJson<NgnMarketListResponse>(
    url,
    { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    "ngx"
  );

  if (!result.ok || !result.data?.data?.data) return [];

  ngnCache = { data: result.data.data.data, fetchedAt: Date.now() };
  return result.data.data.data;
}

async function fetchNgnMarket(symbol: string): Promise<MarketDataResult> {
  const key = process.env.NGNMARKET_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: { code: "NO_API_KEY", message: "NGX data is not configured.", provider: "ngx" },
    };
  }

  const normalized = symbol.toUpperCase();
  const companies = await fetchNgnMarketCompanies();
  const q = companies.find((c) => c.symbol === normalized);

  if (!q) {
    return {
      ok: false,
      error: { code: "INVALID_SYMBOL", message: "We could not find that ticker on the NGX.", provider: "ngx" },
    };
  }

  const price = num(q.price);
  if (price === null || price === 0) {
    return {
      ok: false,
      error: { code: "NO_DATA", message: "No price data available for that ticker.", provider: "ngx" },
    };
  }

  return {
    ok: true,
    data: {
      symbol: str(q.symbol) ?? normalized,
      companyName: str(q.name) ?? normalized,
      exchange: "ngx",
      currency: "NGN",
      price,
      change: num(q.price_change) ?? 0,
      changePercent: num(q.price_change_percent) ?? 0,
      previousClose: num(q.prev_close),
      open: null,
      high: num(q.day_high),
      low: num(q.day_low),
      volume: num(q.volume),
      marketCap: num(q.market_cap),
      peRatio: null,
      eps: null,
      sector: str(q.sector),
      fiftyTwoWeekHigh: num(q.high_52wk),
      fiftyTwoWeekLow: num(q.low_52wk),
    },
  };
}

// -----------------------------------------------------------------------------
// Oanor — Nigerian Exchange (NGX) — Fallback provider
//
// Docs: https://oanor.com/api/ngx-api
// Has: P/E, open, high, low, volume, market cap.
// Missing: 52-week high/low.
// -----------------------------------------------------------------------------

interface OanorQuote {
  ticker: string;
  company: string;
  price: number;
  change: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  market_cap: number;
  pe_ratio: number;
  sector: string;
  currency: string;
}

async function fetchOanor(symbol: string): Promise<MarketDataResult> {
  const key = process.env.OANOR_API_KEY;
  if (!key) {
    return {
      ok: false,
      error: { code: "NO_API_KEY", message: "NGX data is not configured.", provider: "ngx" },
    };
  }

  const normalized = symbol.toUpperCase();
  const url = `https://api.oanor.com/ngx-api/v1/quote?codes=${encodeURIComponent(normalized)}`;

  const result = await fetchJson<Record<string, unknown>>(
    url,
    { "x-oanor-key": key, "Content-Type": "application/json" },
    "ngx"
  );

  if (!result.ok) return result;

  const d = result.data as Record<string, unknown>;
  const data = (typeof d.data === "object" && d.data !== null ? d.data : null) as Record<string, unknown> | null;
  if (!data) {
    return {
      ok: false,
      error: { code: "NO_DATA", message: "Unexpected response format from NGX provider.", provider: "ngx" },
    };
  }

  const quotes = Array.isArray(data.quotes) ? (data.quotes as OanorQuote[]) : [];
  const q = quotes[0];
  if (!q) {
    return {
      ok: false,
      error: { code: "INVALID_SYMBOL", message: "We could not find that ticker on the NGX.", provider: "ngx" },
    };
  }

  const price = num(q.price);
  if (price === null) {
    return {
      ok: false,
      error: { code: "NO_DATA", message: "No price data available for that ticker.", provider: "ngx" },
    };
  }

  return {
    ok: true,
    data: {
      symbol: str(q.ticker) ?? normalized,
      companyName: str(q.company) ?? normalized,
      exchange: "ngx",
      currency: str(q.currency) ?? "NGN",
      price,
      change: num(q.change) ?? 0,
      changePercent: num(q.change_percent) ?? 0,
      previousClose: null,
      open: num(q.open),
      high: num(q.high),
      low: num(q.low),
      volume: num(q.volume),
      marketCap: num(q.market_cap),
      peRatio: num(q.pe_ratio),
      eps: null,
      sector: str(q.sector),
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
    },
  };
}

// -----------------------------------------------------------------------------
// Public entry point
//
// "NGX:" prefix forces the NGX provider, "US:" forces the US provider.
// After getting a result from the primary provider, we try secondary
// providers to fill any null fields (P/E, 52-week, market cap, etc.).
// -----------------------------------------------------------------------------

export function normalizeSymbol(raw: string): { symbol: string; exchange: Exchange | null } {
  const trimmed = raw.trim().toUpperCase().replace(/\.(L|NG|NGX)$/, "");
  if (trimmed.startsWith("NGX:")) return { symbol: trimmed.slice(4), exchange: "ngx" };
  if (trimmed.startsWith("US:")) return { symbol: trimmed.slice(3), exchange: "us" };
  return { symbol: trimmed, exchange: null };
}

export async function getMarketQuote(
  rawSymbol: string
): Promise<MarketDataResult> {
  const { symbol, exchange } = normalizeSymbol(rawSymbol);

  // --- NGX: NGN Market (primary) → enrich with Kobo (P/E) → Oanor fallback ---
  if (exchange === "ngx") {
    const ngn = await fetchNgnMarket(symbol);

    if (ngn.ok && needsEnrichment(ngn.data)) {
      // NGN Market lacks P/E — try Kobo for that.
      const kobo = await fetchKoboTerminal(symbol);
      if (kobo.ok) {
        return { ok: true, data: mergeQuote(ngn.data, kobo.data) };
      }
      // Try Oanor for P/E.
      const oanor = await fetchOanor(symbol);
      if (oanor.ok) {
        return { ok: true, data: mergeQuote(ngn.data, oanor.data) };
      }
    }
    if (ngn.ok) return ngn;

    // NGN Market failed — try Kobo as fallback.
    const kobo = await fetchKoboTerminal(symbol);
    if (kobo.ok) return kobo;

    // Last resort: Oanor.
    const oanor = await fetchOanor(symbol);
    if (oanor.ok) return oanor;

    return ngn; // return the most informative error
  }

  // --- US: Yahoo Finance chart (primary) → enrich with Finnhub (market cap, sector) ---
  if (exchange === "us") {
    const yahoo = await fetchYahooChart(symbol);

    if (yahoo.ok) {
      // Enrich with Finnhub for market cap, sector, etc.
      const finnhub = await fetchFinnhub(symbol);
      if (finnhub.ok) {
        return { ok: true, data: mergeQuote(yahoo.data, finnhub.data) };
      }
      return yahoo;
    }

    // Yahoo failed — try Finnhub as fallback.
    const finnhub = await fetchFinnhub(symbol);
    if (finnhub.ok) return finnhub;

    return yahoo;
  }

  // --- No prefix — try all providers, merge best data ---
  const [yahoo, kobo, ngn, oanor, finnhub] = await Promise.allSettled([
    fetchYahooChart(symbol),
    fetchKoboTerminal(symbol),
    fetchNgnMarket(symbol),
    fetchOanor(symbol),
    fetchFinnhub(symbol),
  ]);

  // Collect successful results by exchange so providers cannot mix currencies.
  const successesByExchange = new Map<MarketQuote["exchange"], MarketQuote[]>();
  let selectedExchange: MarketQuote["exchange"] | undefined;
  for (const r of [yahoo, kobo, ngn, oanor, finnhub]) {
    if (r.status === "fulfilled" && r.value.ok) {
      selectedExchange ??= r.value.data.exchange;
      const exchangeQuotes = successesByExchange.get(r.value.data.exchange) ?? [];
      exchangeQuotes.push(r.value.data);
      successesByExchange.set(r.value.data.exchange, exchangeQuotes);
    }
  }

  const successes = selectedExchange ? successesByExchange.get(selectedExchange) ?? [] : [];
  if (successes.length > 0) {
    let merged = successes[0];
    for (let i = 1; i < successes.length; i++) {
      merged = mergeQuote(merged, successes[i]);
    }
    return { ok: true, data: merged };
  }

  // Return the first error for a meaningful message.
  for (const r of [yahoo, kobo, ngn, oanor, finnhub]) {
    if (r.status === "fulfilled" && !r.value.ok) return r.value;
  }

  return {
    ok: false,
    error: { code: "NO_DATA", message: "We could not find that ticker on any market." },
  };
}

// Exported for use by clients that only need the resolved provider mapping.
export function resolveExchange(rawSymbol: string): Exchange | null {
  return normalizeSymbol(rawSymbol).exchange;
}

// -----------------------------------------------------------------------------
// Stock search — name/ticker autocomplete for the UX layer.
//
// Uses the cached NGN Market or Kobo stocks list to find matches.
// Returns up to `limit` results (default 8).
// -----------------------------------------------------------------------------

export interface StockSearchResult {
  symbol: string;
  name: string;
  sector: string;
}

export async function searchStocks(
  query: string,
  exchange?: Exchange,
  limit = 8
): Promise<StockSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // US autocomplete uses the local seed data; NGX uses live provider data.
  let companies: { symbol: string; name: string; sector: string }[] = [];

  if (exchange === "us") {
    companies = US_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      sector: s.sector,
    }));
  } else {
    const ngnCompanies = await fetchNgnMarketCompanies();
    if (ngnCompanies.length > 0) {
      companies = ngnCompanies.map((c) => ({
        symbol: c.symbol,
        name: c.name,
        sector: c.sector,
      }));
    } else {
      const koboStocks = await fetchKoboStocks();
      companies = koboStocks.map((s) => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
      }));
    }
  }

  if (!companies.length) return [];

  const q = trimmed.toUpperCase();

  // 1. Exact symbol match — return immediately.
  const exact = companies.find((s) => s.symbol === q);
  if (exact) {
    return [{ symbol: exact.symbol, name: exact.name, sector: exact.sector }];
  }

  // 2. Score remaining stocks.
  const scored: { item: (typeof companies)[number]; score: number }[] = [];
  for (const s of companies) {
    let score = 0;
    const sym = s.symbol.toUpperCase();
    const name = s.name.toUpperCase();

    if (sym.startsWith(q)) score = 100 - sym.length;
    else if (name.includes(q)) score = 50 - name.indexOf(q);
    else {
      const words = name.split(/\s+/);
      const qWords = q.split(/\s+/);
      const allWordsMatch = qWords.every((qw) => words.some((w) => w.startsWith(qw)));
      if (allWordsMatch) score = 30;
    }

    if (score > 0) scored.push({ item: s, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => ({
    symbol: s.item.symbol,
    name: s.item.name,
    sector: s.item.sector,
  }));
}
