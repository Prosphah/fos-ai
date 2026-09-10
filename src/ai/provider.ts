import { createGoogleGenerativeAI } from "@ai-sdk/google";

// -----------------------------------------------------------------------------
// AI Provider Configuration
//
// ADR-004: All inference passes through a provider abstraction. During the MVP
// this is the Vercel AI SDK backed by Google Gemini. The model id is read from
// the environment so it can be tuned without code changes.
// -----------------------------------------------------------------------------

const rawModelId =
  process.env.GOOGLE_AI_MODEL ?? process.env.GEMINI_MODEL ?? "";
// 2026-09: Google retired gemini-2.0-flash and gemini-2.5-* models (404).
// Keep env override but default to the current GA flash model.
const baseModelId = rawModelId.trim() || "gemini-3.6-flash";
const DEPRECATED_MODEL_MAP: Record<string, string> = {
  "gemini-2.5-flash": "gemini-3.6-flash",
  "gemini-2.5-pro": "gemini-3.6-flash",
  "gemini-2.0-flash": "gemini-3.6-flash",
};
const modelId = DEPRECATED_MODEL_MAP[baseModelId] ?? baseModelId;

function getApiKey(): string | undefined {
  return (
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );
}

// Lazily initialised so the module can be imported even when no key is present.
function getProvider() {
  const provider = createGoogleGenerativeAI({ apiKey: getApiKey() });
  return provider(modelId);
}

export function getModelId(): string {
  return modelId;
}

export function getStockAnalysisModel() {
  if (!getApiKey()) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Add it to your environment to enable stock analysis."
    );
  }
  return getProvider();
}

export function isAiConfigured(): boolean {
  return Boolean(getApiKey());
}
