import type { InvestmentAnalysis } from "@/services/investment-analysis.service";
import { riskLevelLabel } from "@/services/investment-analysis.service";

// -----------------------------------------------------------------------------
// Context Assembly & Prompt Construction
//
// Per the AI Architecture, the prompt is assembled from:
//   1. System Identity
//   2. Capability Instructions
//   3. User Context (risk profile)
//   4. Tool Results (deterministic analysis)
//
// The model is only ever asked to explain deterministic outputs — it never
// computes or fabricates numbers (ADR-001, "AI Never Owns Data").
// -----------------------------------------------------------------------------

export interface UserRiskContext {
  profile: string | null;
  score: number | null;
  experience: string | null;
  horizon: number | null;
}

const SYSTEM_IDENTITY = `You are FOS-AI Coach, a calm, beginner-friendly financial coach for the FOS-AI platform. You help everyday investors in Nigeria and beyond make informed decisions. You explain clearly, translate jargon into plain language, and never pressure a user into an action.`;

const CAPABILITY_INSTRUCTIONS = `You are performing a single-stock analysis ("Analyze Stock").

Your job is to EXPLAIN the deterministic analysis you are given. Never invent prices, ratios, or returns that are not in the data. Never predict a future price with certainty. Never make a guaranteed-return claim.

Structure your response with these sections, using short paragraphs and bullets (not walls of text):
1. A 1-2 sentence plain-language summary of the company and how it looks today.
2. "What the numbers say" — walk through the key figures provided (price, day change, P/E, market cap, 52-week range) in simple terms.
3. "What looks encouraging" — pull only from the highlights provided.
4. "What to watch out for" — pull only from the concerns provided.
5. "Best-fit investor" — describe who this may suit given the risk level and the user's own risk profile. Respect Article VIII: never recommend something materially outside the user's risk tolerance without stating the trade-off.
6. "Suggested horizon" — a reasonable time window for owning such an investment (longer periods suit higher-volatility names).
7. A closing reminder that this is education, not advice, and to do independent research.

Rules:
- Use the user's risk profile to personalise ("Given your {profile} risk profile..."). If no profile exists, say the advice is general.
- Distinguish facts, analysis, assumptions, and opinions (Article VI).
- If anything is uncertain, say so explicitly (Article XII).
- Keep it educational and encouraging long-term discipline (Constitution, Article V & IX).`;

const DISCLAIMER = `Important: This analysis is for education and decision support only. It is not financial advice, a recommendation to buy or sell, or a guarantee of any outcome. Markets are volatile and past or current figures do not predict future performance. Please consider your own circumstances and, where appropriate, consult a licensed financial professional.`;

function describeRisk(ctx: UserRiskContext | null): string {
  if (!ctx) {
    return "The user's risk profile is not available, so this analysis will be general rather than personalised.";
  }
  const parts: string[] = [];
  if (ctx.profile) parts.push(`profile: ${ctx.profile}`);
  if (ctx.score !== null && ctx.score !== undefined)
    parts.push(`score: ${ctx.score}/100`);
  if (ctx.experience) parts.push(`investment experience: ${ctx.experience}`);
  if (ctx.horizon) parts.push(`stated horizon: ${ctx.horizon} years`);
  if (parts.length === 0)
    return "The user has a profile on file but no risk details yet.";
  return `The user's risk context — ${parts.join(", ")}.`;
}

function renderToolResult(a: InvestmentAnalysis): string {
  const metricLines = a.metrics
    .map((m) => `- ${m.label}: ${m.value} — ${m.detail}`)
    .join("\n");

  const featureLines = a.features
    .map((f) => `- ${f.label}: ${f.value} (${f.tone})`)
    .join("\n");

  const highlights =
    a.highlights.length > 0 ? a.highlights.map((h) => `- ${h}`).join("\n") : "- (none)";
  const concerns =
    a.concerns.length > 0 ? a.concerns.map((c) => `- ${c}`).join("\n") : "- (none)";

  return [
    `Symbol: ${a.symbol}`,
    `Company: ${a.companyName}`,
    `Exchange: ${a.exchange === "ngx" ? "Nigerian Exchange (NGX)" : "US market"}`,
    `Currency: ${a.currency}`,
    `Risk level (derived): ${riskLevelLabel[a.riskLevel]} (score ${a.riskScore}/100)`,
    "",
    "Metrics:",
    metricLines,
    "",
    "Features:",
    featureLines,
    "",
    "Highlights:",
    highlights,
    "",
    "Concerns:",
    concerns,
  ].join("\n");
}

export function buildStockAnalysisPrompt(
  analysis: InvestmentAnalysis,
  userRisk: UserRiskContext | null
): { system: string; prompt: string } {
  const userContext = describeRisk(userRisk);
  const toolResult = renderToolResult(analysis);

  const prompt = [
    `User context:\n${userContext}`,
    "",
    "Deterministic analysis result (authoritative — do not alter these figures):",
    toolResult,
    "",
    "Please provide the structured stock analysis described in your instructions.",
    "",
    DISCLAIMER,
  ].join("\n");

  return {
    system: [SYSTEM_IDENTITY, CAPABILITY_INSTRUCTIONS].join("\n\n"),
    prompt,
  };
}
