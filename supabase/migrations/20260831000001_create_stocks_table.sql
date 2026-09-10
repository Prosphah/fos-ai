-- Create stocks table for search autocomplete
CREATE TABLE IF NOT EXISTS stocks (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange TEXT NOT NULL CHECK (exchange IN ('ngx', 'us')),
  sector TEXT,
  currency TEXT NOT NULL DEFAULT 'NGN'
);

-- No RLS — this is a public reference table for autocomplete lookups.
ALTER TABLE stocks DISABLE ROW LEVEL SECURITY;

-- Indexes for prefix search and exchange filtering.
CREATE INDEX IF NOT EXISTS idx_stocks_exchange ON stocks(exchange, symbol);
CREATE INDEX IF NOT EXISTS idx_stocks_search ON stocks USING gin (
  to_tsvector('english', symbol || ' ' || name || ' ' || coalesce(sector, ''))
);