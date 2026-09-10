import { streamText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getMarketQuote } from "@/services/market-data.service";
import { analyzeInvestment } from "@/services/investment-analysis.service";
import { getModelId, getStockAnalysisModel } from "@/ai/provider";
import {
  buildStockAnalysisPrompt,
  type UserRiskContext,
} from "@/ai/stock-analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANALYSIS_RATE_LIMIT_WINDOW_MS = 60_000;
const ANALYSIS_RATE_LIMIT_MAX_REQUESTS = 10;
const analysisRequests = new Map<string, number[]>();

function isAnalysisRateLimited(userId: string): boolean {
  const now = Date.now();
  const recentRequests = (analysisRequests.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < ANALYSIS_RATE_LIMIT_WINDOW_MS
  );

  if (recentRequests.length >= ANALYSIS_RATE_LIMIT_MAX_REQUESTS) {
    analysisRequests.set(userId, recentRequests);
    return true;
  }

  recentRequests.push(now);
  analysisRequests.set(userId, recentRequests);
  return false;
}

async function loadUserRiskContext(userId: string): Promise<UserRiskContext | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("financial_profiles")
      .select("risk_profile, risk_score, investment_experience, investment_horizon_years")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      profile: data.risk_profile,
      score: data.risk_score,
      experience: data.investment_experience,
      horizon: data.investment_horizon_years,
    };
  } catch {
    return null;
  }
}

function errorStream(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
  // Authenticated-only (decision from planning).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return errorStream("You must be signed in to analyze a stock.", 401);
  }

  let symbol: string;
  try {
    const body = await request.json();
    symbol = String(body?.symbol ?? "").trim();
  } catch {
    return errorStream("A ticker symbol is required.");
  }
  if (!symbol) return errorStream("Please enter a ticker symbol.");
  if (isAnalysisRateLimited(user.id)) {
    return errorStream("Too many analysis requests. Please try again shortly.", 429);
  }

  // 1. Deterministic market data (ADR-001).
  const quote = await getMarketQuote(symbol);
  if (!quote.ok) {
    const status =
      quote.error.code === "NO_API_KEY"
        ? 503
        : quote.error.code === "RATE_LIMITED"
          ? 429
          : quote.error.code === "PROVIDER_ERROR"
            ? 502
            : 404;
    return errorStream(quote.error.message, status);
  }

  // 2. Deterministic analysis.
  const analysis = analyzeInvestment(quote.data);

  // 3. Personalised context.
  const userRisk = await loadUserRiskContext(user.id);
  const { system, prompt } = buildStockAnalysisPrompt(analysis, userRisk);

  // 4. Stream the AI explanation.
  // Guard against empty model id (e.g. GOOGLE_AI_MODEL="" in .env.local).
  const resolvedModelId = getModelId();
  if (!resolvedModelId.trim()) {
    console.error("Stock analysis: resolved modelId is empty");
    return errorStream("AI model is not configured. Check GOOGLE_AI_MODEL.", 503);
  }

  try {
    const model = getStockAnalysisModel();
    console.log(`Stock analysis streaming for ${symbol} with model ${resolvedModelId} promptLen=${prompt.length}`);
    const result = streamText({
      model,
      system,
      prompt,
      onError(event) {
        console.error("Stock analysis stream onError:", event.error);
      },
      onFinish(event) {
        if (!event.text || event.text.trim().length === 0) {
          console.warn(`Stock analysis finished with empty text for ${symbol} finishReason=${event.finishReason} usage=${JSON.stringify(event.usage)}`);
        }
      },
    });

    // Attach a consumer to surface async errors via the stream error handler.
    // We also proactively detect provider 404s (e.g. bad model id) by waiting
    // briefly for the first chunk - but we still return the streaming response
    // so the client TextDecoder loop works (text/plain).
    result.consumeStream({
      onError(error) {
        console.error("Stock analysis consumeStream onError:", error);
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("Stock analysis streaming failed:", err);
    if (err instanceof Error) {
      if (err.message.includes("GOOGLE_AI_API_KEY")) return errorStream(err.message, 503);
      // Surface AI provider 404s (e.g. ":streamGenerateContent") as 502 so the
      // client shows the provider message instead of a silent empty stream.
      const msg = err.message.toLowerCase();
      if (msg.includes("not found") || msg.includes("404") || msg.includes("apicallerror")) {
        return errorStream(`AI provider error: ${err.message}`, 502);
      }
    }
    return errorStream("The AI service is temporarily unavailable. Please try again.", 503);
  }
}
