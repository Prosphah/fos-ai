import type { MarketQuote } from "@/types/investment";

// -----------------------------------------------------------------------------
// Deterministic Investment Analysis
//
// Following ADR-001 ("AI performs reasoning only"), every numeric signal here is
// computed in code. The AI later receives these outputs and explains them.
//
// All signals are surfaced as neutral facts plus a "tone" so the AI never has to
// invent numbers.
// -----------------------------------------------------------------------------

export type Tone = "positive" | "neutral" | "negative";

export interface PriceMetric {
  label: string;
  value: string;
  tone: Tone;
  detail: string;
}

export interface AnalysisFeature {
  key: string;
  label: string;
  value: string;
  tone: Tone;
}

export interface InvestmentAnalysis {
  symbol: string;
  companyName: string;
  exchange: "ngx" | "us";
  currency: string;
  price: number;
  changePercent: number;
  // Risk score 0-100 (higher = more risk).
  riskScore: number;
  riskLevel: "low" | "moderate" | "high" | "very-high";
  // Forward-looking signal buckets the AI can cite.
  valuation: Tone;
  momentum: Tone;
  liquidity: Tone;
  size: Tone;
  // Human-readable highlights.
  highlights: string[];
  concerns: string[];
  metrics: PriceMetric[];
  features: AnalysisFeature[];
}

function toneFrom(score: number): Tone {
  if (score >= 0.5) return "positive";
  if (score <= -0.5) return "negative";
  return "neutral";
}

function pct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function compact(value: number | null, currency: string): string {
  if (value === null || value <= 0) return "—";
  const v = Math.abs(value);
  const symbol = currency === "USD" ? "$" : "₦";
  if (v >= 1e12) return `${symbol}${(value / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${symbol}${(value / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${symbol}${(value / 1e6).toFixed(2)}M`;
  return `${symbol}${value.toFixed(0)}`;
}

function formatPrice(value: number, currency: string): string {
  const symbol = currency === "USD" ? "$" : "₦";
  return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function analyzeInvestment(q: MarketQuote): InvestmentAnalysis {
  const liquidity = q.volume && q.volume > 0;
  const movers = Math.min(Math.abs(q.changePercent), 100);

  // Momentum: recent day move magnitude + direction.
  const momentumScore = q.changePercent >= 0 ? Math.min(q.changePercent / 5, 1) : Math.max(q.changePercent / -5, -1);

  // Valuation: low P/E and a reasonable distance below 52w high reads as value.
  let valuationScore = 0;
  if (q.peRatio && q.peRatio > 0) {
    valuationScore += q.peRatio < 15 ? 0.7 : q.peRatio <= 30 ? 0 : -0.7;
  }
  if (q.fiftyTwoWeekHigh && q.fiftyTwoWeekHigh > 0) {
    const drawdown = (q.price - q.fiftyTwoWeekHigh) / q.fiftyTwoWeekHigh;
    if (drawdown <= -0.25) valuationScore += 0.4;
    else if (drawdown >= 0.1) valuationScore -= 0.4;
  }
  valuationScore = Math.max(-1, Math.min(1, valuationScore));

  // Size: bigger companies are usually lower risk.
  const sizeScore =
    q.marketCap && q.marketCap > 0
      ? q.marketCap >= 1e9
        ? 0.7
        : q.marketCap >= 1e8
          ? 0.3
          : -0.3
      : 0;

  // Composite risk score (0 = safe, 100 = risky).
  let riskScore = 50;
  riskScore += (1 - sizeScore) * 20; // smaller => riskier
  riskScore += (1 - momentumScore) * 5; // falling momentum slightly riskier
  if (q.peRatio && q.peRatio > 0 && q.peRatio > 40) riskScore += 15; // expensive
  if (!liquidity) riskScore += 10; // low/no volume
  if (movers > 8) riskScore += 5; // volatile day
  riskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

  const riskLevel =
    riskScore >= 75 ? "very-high" : riskScore >= 55 ? "high" : riskScore >= 35 ? "moderate" : "low";

  const highlights: string[] = [];
  const concerns: string[] = [];

  if (q.changePercent > 0) highlights.push(`Up ${pct(q.changePercent)} on the last session.`);
  if (q.changePercent < 0) concerns.push(`Down ${pct(Math.abs(q.changePercent))} on the last session.`);
  if (q.peRatio && q.peRatio > 0 && q.peRatio <= 20)
    highlights.push(`Trades at a P/E of ${q.peRatio.toFixed(1)}, which can point to a modest valuation.`);
  if (q.peRatio && q.peRatio > 0 && q.peRatio > 35)
    concerns.push(`Trades at a P/E of ${q.peRatio.toFixed(1)}, a relatively expensive multiple.`);
  if (q.marketCap && q.marketCap >= 1e9)
    highlights.push(`A larger-cap company (market cap ${compact(q.marketCap, q.currency)}), usually more stable.`);
  if (q.marketCap && q.marketCap > 0 && q.marketCap < 1e8)
    concerns.push(`A smaller-cap company (market cap ${compact(q.marketCap, q.currency)}), which can be more volatile.`);
  if (!liquidity) concerns.push("Little or no trading volume, which can reduce liquidity.");
  if (movers > 8) concerns.push(`Sharp move (${pct(q.changePercent)}) indicates elevated volatility today.`);

  const metrics: PriceMetric[] = [
    {
      label: "Price",
      value: formatPrice(q.price, q.currency),
      tone: "neutral",
      detail: `Last traded price in ${q.currency}.`,
    },
    {
      label: "Day Change",
      value: pct(q.changePercent),
      tone: q.changePercent >= 0 ? "positive" : "negative",
      detail: "Change compared with the previous close.",
    },
    {
      label: "Market Cap",
      value: compact(q.marketCap, q.currency),
      tone: q.marketCap === null ? "neutral" : q.marketCap >= 0 ? "positive" : "negative",
      detail: "Total value of the company's shares.",
    },
    {
      label: "P/E Ratio",
      value: q.peRatio ? q.peRatio.toFixed(1) : "—",
      tone: q.peRatio && q.peRatio > 0 ? (q.peRatio <= 30 ? "positive" : "negative") : "neutral",
      detail: "Price divided by earnings per share.",
    },
    {
      label: "52-Week High",
      value: q.fiftyTwoWeekHigh ? formatPrice(q.fiftyTwoWeekHigh, q.currency) : "—",
      tone: "neutral",
      detail: "Highest price over the past year.",
    },
    {
      label: "52-Week Low",
      value: q.fiftyTwoWeekLow ? formatPrice(q.fiftyTwoWeekLow, q.currency) : "—",
      tone: "neutral",
      detail: "Lowest price over the past year.",
    },
  ];

  const features: AnalysisFeature[] = [
    { key: "valuation", label: "Valuation", value: q.peRatio ? `${q.peRatio.toFixed(1)}x` : "n/a", tone: toneFrom(valuationScore) },
    { key: "momentum", label: "Momentum", value: pct(q.changePercent), tone: toneFrom(momentumScore) },
    {
      key: "liquidity",
      label: "Liquidity",
      value: liquidity ? "Adequate" : "Thin",
      tone: liquidity ? "positive" : "negative",
    },
    { key: "size", label: "Company Size", value: compact(q.marketCap, q.currency), tone: toneFrom(sizeScore) },
  ];

  return {
    symbol: q.symbol,
    companyName: q.companyName,
    exchange: q.exchange,
    currency: q.currency,
    price: q.price,
    changePercent: q.changePercent,
    riskScore,
    riskLevel,
    valuation: toneFrom(valuationScore),
    momentum: toneFrom(momentumScore),
    liquidity: liquidity ? "positive" : "negative",
    size: toneFrom(sizeScore),
    highlights,
    concerns,
    metrics,
    features,
  };
}

// Mapping used to phrase the risk level for the AI prompt in plain language.
export const riskLevelLabel: Record<InvestmentAnalysis["riskLevel"], string> = {
  low: "low",
  moderate: "moderate",
  high: "high",
  "very-high": "very high",
};
