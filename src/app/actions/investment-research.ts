"use server";

import { createClient } from "@/lib/supabase/server";
import { getMarketQuote } from "@/services/market-data.service";
import { analyzeInvestment } from "@/services/investment-analysis.service";

// -----------------------------------------------------------------------------
// Investment Research server action
//
// Returns the deterministic market data + analysis for a ticker without invoking
// the AI. The UI can use this to render a quick data card alongside the AI
// explanation, and it doubles as a lightweight validation endpoint.
// -----------------------------------------------------------------------------

export async function getStockAnalysisData(rawSymbol: string): Promise<{
  ok: boolean;
  error?: string;
  data?: ReturnType<typeof analyzeInvestment>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to analyze a stock." };

  const symbol = rawSymbol?.trim();
  if (!symbol) return { ok: false, error: "Please enter a ticker symbol." };

  const quote = await getMarketQuote(symbol);
  if (!quote.ok) return { ok: false, error: quote.error.message };

  return { ok: true, data: analyzeInvestment(quote.data) };
}

// -----------------------------------------------------------------------------
// Stock search — DB-backed typeahead autocomplete.
//
// Queries the `stocks` Supabase table first (instant, no API quota concerns).
// Falls back to the Kobo in-memory cache if the table is empty (lazy seed).
// -----------------------------------------------------------------------------

type StockRow = {
  symbol: string;
  name: string;
  sector: string | null;
  exchange: string;
};

function rankStockRows(rows: StockRow[], query: string) {
  return rows
    .map((row) => {
      const symbol = row.symbol.toUpperCase();
      const name = row.name.toUpperCase();
      let score = 0;
      if (symbol === query) score = 200;
      else if (symbol.startsWith(query)) score = 100 - symbol.length;
      else if (name.includes(query)) score = 50 - name.indexOf(query);
      else score = 10;
      return { ...row, score };
    })
    .sort((a, b) => b.score - a.score);
}

export async function searchStocksAction(
  query: string,
  exchange?: "ngx" | "us"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = trimmed.toUpperCase();

  // 1. Try the Supabase `stocks` table first (fast, no quota).
  const { data: rows, error } = await supabase
    .from("stocks")
    .select("symbol, name, sector, exchange")
    .or(`symbol.ilike.${q}%,name.ilike.%${q}%`)
    .order("symbol");

  if (!error && rows && rows.length > 0) {
    let filtered = rows as StockRow[];

    // Filter by exchange if specified.
    if (exchange) {
      filtered = filtered.filter((r) => r.exchange === exchange);
    }

    const scored = rankStockRows(filtered, q);
    return scored.slice(0, 8).map((r) => ({
      symbol: r.symbol,
      name: r.name,
      sector: r.sector ?? "",
    }));
  }

  // 2. If the table is empty (migration not yet run), lazy-seed from seed data.
  if (!error && rows && rows.length === 0) {
    const { count: stockCount, error: countError } = await supabase
      .from("stocks")
      .select("symbol", { count: "exact", head: true });

    if (!countError && stockCount === 0) {
      const seeded = await seedStocksTable(supabase);
      if (seeded > 0) {
        // Re-run the query now that data exists.
        const { data: seededRows } = await supabase
          .from("stocks")
          .select("symbol, name, sector, exchange")
          .or(`symbol.ilike.${q}%,name.ilike.%${q}%`)
          .order("symbol");

        if (seededRows && seededRows.length > 0) {
          let filtered = seededRows as StockRow[];
          if (exchange) {
            filtered = filtered.filter((r) => r.exchange === exchange);
          }
          return rankStockRows(filtered, q).slice(0, 8).map((r) => ({
            symbol: r.symbol,
            name: r.name,
            sector: r.sector ?? "",
          }));
        }
      }
    }
  }

  // 3. Final fallback: Kobo in-memory cache (works without Supabase).
  const { searchStocks } = await import("@/services/market-data.service");
  return searchStocks(query, exchange);
}

// ---------------------------------------------------------------------------
// Lazy seed — inserts all seed stocks into the `stocks` table if empty.
// Runs once per cold-start. Returns the number of rows inserted.
// ---------------------------------------------------------------------------

async function seedStocksTable(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  try {
    const { ALL_STOCKS } = await import("@/lib/stocks-data");
    const rows = ALL_STOCKS.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
      sector: s.sector,
      currency: s.currency,
    }));

    // Upsert in batches of 50 to avoid payload limits.
    const BATCH = 50;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase.from("stocks").upsert(batch, { onConflict: "symbol" });
      if (error) {
        console.error("seedStocksTable batch error:", error);
        break;
      }
      inserted += batch.length;
    }
    return inserted;
  } catch (err) {
    console.error("seedStocksTable failed:", err);
    return 0;
  }
}
