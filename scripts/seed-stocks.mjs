// Quick script to seed the stocks table via Supabase REST API.
// Run: node scripts/seed-stocks.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const BATCH_SIZE = 50;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable.");
}

async function upsert(rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/stocks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.status;
}

async function main() {
  // Import the seed data from the app source.
  const mod = await import("../src/lib/stocks-data.ts");
  const stocks = mod.ALL_STOCKS;

  console.log(`Seeding ${stocks.length} stocks...`);

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE).map((s) => ({
      symbol: s.symbol,
      name: s.name,
      exchange: s.exchange,
      sector: s.sector,
      currency: s.currency,
    }));
    const status = await upsert(batch);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} rows (HTTP ${status})`);
  }

  // Verify.
  const verifyRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stocks?select=count&head=true`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  const count = verifyRes.headers.get("content-range");
  console.log(`Done. Content-Range: ${count}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
