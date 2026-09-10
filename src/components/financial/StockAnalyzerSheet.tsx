"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Loader2,
  Search,
  Inbox,
} from "lucide-react";
import { LogoIcon } from "@/components/brand/LogoIcon";
import { getStockAnalysisData, searchStocksAction } from "@/app/actions/investment-research";
import type { InvestmentAnalysis } from "@/services/investment-analysis.service";
import type { StockSearchResult } from "@/services/market-data.service";

interface StockAnalyzerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UiState =
  | { status: "idle" }
  | { status: "loading-data" }
  | { status: "loading-ai" }
  | { status: "streaming" }
  | { status: "done" }
  | { status: "error"; message: string };

function suggestionId(symbol: string): string {
  return `stock-option-${symbol.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

const toneColor = (tone: "positive" | "neutral" | "negative") =>
  tone === "positive" ? "var(--positive, #16a34a)" : tone === "negative" ? "var(--destructive, #dc2626)" : "var(--text-2)";

const riskColor = (level: InvestmentAnalysis["riskLevel"]) =>
  level === "low" ? "#16a34a" : level === "moderate" ? "#ca8a04" : level === "high" ? "#ea580c" : "#dc2626";

export function StockAnalyzerSheet({ open, onOpenChange }: StockAnalyzerSheetProps) {
  const [symbol, setSymbol] = useState("");
  const [exchange, setExchange] = useState<"ngx" | "us" | null>(null);
  const [state, setState] = useState<UiState>({ status: "idle" });
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [aiText, setAiText] = useState("");
  const [modelHint, setModelHint] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Typeahead state.
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Abort any in-flight stream when the panel unmounts (React cleanup).
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  // Debounced stock search — fires 150ms after the user stops typing.
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = symbol.trim();
    if (!q) return;

    let cancelled = false;
    searchTimerRef.current = setTimeout(async () => {
      setSuggestionsLoading(true);
      setShowSuggestions(true);
      const results = await searchStocksAction(q, exchange ?? undefined);
      if (cancelled) return;
      setSuggestions(results);
      setSuggestionsLoading(false);
      setShowSuggestions(true);
      setHighlightIndex(-1);
    }, 150);

    return () => {
      cancelled = true;
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [symbol, exchange]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        abortRef.current?.abort();
        abortRef.current = null;
        setState({ status: "idle" });
        setAnalysis(null);
        setAiText("");
        setSymbol("");
        setExchange(null);
        setModelHint(null);
        setSuggestions([]);
        setShowSuggestions(false);
        setSuggestionsLoading(false);
      }
      onOpenChange(next);
    },
    [onOpenChange]
  );

  const selectSuggestion = useCallback((result: StockSearchResult) => {
    setSymbol(result.symbol);
    setShowSuggestions(false);
    setSuggestions([]);
    setSuggestionsLoading(false);
  }, []);

  const run = useCallback(async () => {
    const ticker = symbol.trim();
    if (!ticker) return;
    abortRef.current?.abort();
    setAiText("");
    setShowSuggestions(false);
    setState({ status: "loading-data" });

    // Prefix with exchange if user selected one — ensures getMarketQuote
    // routes to the correct provider (e.g. "NGX:DANGCEM" or "US:AAPL").
    const rawSymbol = exchange ? `${exchange.toUpperCase()}:${ticker}` : ticker;

    // 1. Deterministic data via server action.
    const res = await getStockAnalysisData(rawSymbol);
    if (!res.ok || !res.data) {
      setState({ status: "error", message: res.error ?? "We could not analyze that ticker." });
      return;
    }
    setAnalysis(res.data);
    setModelHint(
      res.data.exchange === "ngx"
        ? "Nigerian Exchange data"
        : "US market data"
    );

    // 2. Stream the AI explanation.
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: "loading-ai" });

    try {
      const response = await fetch("/api/ai/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: rawSymbol }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = "The analysis could not be generated.";
        try {
          const body = await response.json();
          if (body?.error) message = body.error;
        } catch {
          /* ignore */
        }
        if (response.status === 401) {
          message = "Please sign in to analyze a stock.";
        }
        setState({ status: "error", message });
        return;
      }

      if (!response.body) {
        setState({ status: "error", message: "No response received." });
        return;
      }

      setState({ status: "streaming" });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAiText(text);
      }

      text = text.trim();
      setAiText(text);
      // Empty stream means the provider errored but the stream still
      // returned 200 (async errors are not surfaced as HTTP status).
      // Surface as an error instead of an empty card (the reported bug).
      if (!text) {
        console.error("Stock analysis returned empty stream for", rawSymbol);
        setState({
          status: "error",
          message:
            "The AI returned no content for that ticker. Please try again.",
        });
        return;
      }
      setState({ status: "done" });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      console.error("Stock analysis fetch failed:", err);
      setState({ status: "error", message: "The AI service is temporarily unavailable." });
    }
  }, [symbol, exchange]);

  const busy = state.status === "loading-data" || state.status === "loading-ai";
  const streaming = state.status === "streaming";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        centerOnDesktop
        showCloseButton
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          backdropFilter: "blur(24px)",
        }}
      >
        <SheetHeader className="flex flex-row items-center gap-3 p-5 pb-2">
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, var(--accent), #4F3DC9)",
              color: "#fff",
              boxShadow: "0 4px 16px var(--accent-glow)",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={20} />
          </div>
          <div className="flex flex-col gap-0.5">
            <SheetTitle
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.125rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
              }}
            >
              Stock Analyzer
            </SheetTitle>
            <SheetDescription
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-2)",
              }}
            >
              Get a clear breakdown of a stock. Not financial advice.
            </SheetDescription>
          </div>
        </SheetHeader>

        <div
          className="scrollbar-thin"
          style={{ padding: "0 20px 28px", maxHeight: "calc(85vh - 120px)", overflowY: "auto" }}
        >
          {/* Exchange selector */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px" }}>
            {(["ngx", "us"] as const).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setExchange(exchange === ex ? null : ex);
                  setSuggestions([]);
                  setShowSuggestions(false);
                  setSuggestionsLoading(false);
                }}
                style={{
                  padding: "6px 16px",
                  borderRadius: "999px",
                  border: "1px solid",
                  borderColor: exchange === ex ? "var(--accent)" : "var(--glass-border)",
                  background: exchange === ex ? "color-mix(in srgb, var(--accent) 14%, transparent)" : "var(--glass-bg)",
                  color: exchange === ex ? "var(--accent)" : "var(--text-2)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {ex === "ngx" ? "NGX" : "US"}
              </button>
            ))}
          </div>

          {/* Ticker input */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-3)",
                  pointerEvents: "none",
                }}
              />
              <Input
                value={symbol}
                role="combobox"
                aria-expanded={showSuggestions}
                aria-controls="stock-suggestions"
                aria-activedescendant={
                  highlightIndex >= 0 && suggestions[highlightIndex]
                    ? suggestionId(suggestions[highlightIndex].symbol)
                    : undefined
                }
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setSymbol(val);
                  setHighlightIndex(-1);
                  if (!val.trim()) {
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (showSuggestions && highlightIndex >= 0) {
                      e.preventDefault();
                      selectSuggestion(suggestions[highlightIndex]);
                    } else if (!busy) {
                      setShowSuggestions(false);
                      run();
                    }
                  } else if (e.key === "ArrowDown" && showSuggestions) {
                    e.preventDefault();
                    setHighlightIndex((i) => (i + 1) % suggestions.length);
                  } else if (e.key === "ArrowUp" && showSuggestions) {
                    e.preventDefault();
                    setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
                  } else if (e.key === "Escape") {
                    setShowSuggestions(false);
                  }
                }}
                onBlur={() => {
                  // Delay hiding so clicks on suggestions register first.
                  setTimeout(() => setShowSuggestions(false), 150);
                }}
                onFocus={() => {
                  setShowSuggestions(symbol.trim().length > 0);
                }}
                placeholder="Search by company name or ticker, e.g. Dangote Cement"
                autoComplete="off"
                style={{
                  height: "44px",
                  paddingLeft: "36px",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  fontSize: "0.875rem",
                  boxShadow: "none",
                }}
                disabled={busy}
              />
              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div
                  id="stock-suggestions"
                  role="listbox"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "6px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--glass-border)",
                    background: "color-mix(in srgb, var(--bg) 96%, transparent)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
                    zIndex: 50,
                    maxHeight: "260px",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {suggestionsLoading ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "12px 16px",
                        fontSize: "0.8125rem",
                        color: "var(--text-2)",
                      }}
                    >
                      <Loader2 size={15} className="animate-spin" />
                      Searching…
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "14px 16px",
                        fontSize: "0.8125rem",
                        color: "var(--text-3)",
                      }}
                    >
                      <Inbox size={15} style={{ flexShrink: 0 }} />
                      No matches found in this exchange.
                    </div>
                  ) : (
                    suggestions.map((s, i) => (
                      <button
                        key={s.symbol}
                        type="button"
                        id={suggestionId(s.symbol)}
                        role="option"
                        aria-selected={highlightIndex === i}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestion(s);
                        }}
                        onMouseEnter={() => setHighlightIndex(i)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          width: "100%",
                          padding: "10px 14px",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: "0.8125rem",
                          background:
                            i === highlightIndex
                              ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                              : "transparent",
                          color: "var(--text-1)",
                          transition: "background 0.12s ease",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: "0.8125rem",
                            letterSpacing: "0.02em",
                            color: "var(--accent)",
                            minWidth: "64px",
                          }}
                        >
                          {s.symbol}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            color: "var(--text-2)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.name}
                        </span>
                        {s.sector && (
                          <span
                            style={{
                              flexShrink: 0,
                              fontSize: "0.6875rem",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              border: "1px solid var(--glass-border)",
                              background: "var(--glass-bg)",
                              color: "var(--text-3)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {s.sector}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={run}
              disabled={busy || !symbol.trim()}
              style={{ height: "44px", paddingInline: "18px" }}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogoIcon size={18} />}
              {busy ? "Analyzing" : "Analyze"}
            </Button>
          </div>

          {/* Error */}
          {state.status === "error" && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--destructive-border, #dc262633)",
                background: "color-mix(in srgb, var(--destructive, #dc2626) 10%, transparent)",
                color: "var(--destructive)",
                fontSize: "0.875rem",
                marginBottom: "16px",
              }}
            >
              {state.message}
            </div>
          )}

          {/* Loading skeleton while fetching market data */}
          {state.status === "loading-data" && (
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                  <Skeleton style={{ height: 18, width: "45%", borderRadius: 6 }} />
                  <Skeleton style={{ height: 12, width: "62%", borderRadius: 6 }} />
                </div>
                <Skeleton style={{ height: 22, width: 74, borderRadius: 999 }} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: "var(--radius-xs)",
                      padding: "10px 12px",
                      background: "color-mix(in srgb, var(--bg) 55%, transparent)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <Skeleton style={{ height: 10, width: "70%", borderRadius: 5, marginBottom: 8 }} />
                    <Skeleton style={{ height: 14, width: "50%", borderRadius: 5 }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deterministic data card */}
          {analysis && (
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                padding: "16px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-1)" }}>
                    {analysis.companyName}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {analysis.symbol} · {modelHint}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    color: "#fff",
                    background: riskColor(analysis.riskLevel),
                    whiteSpace: "nowrap",
                  }}
                >
                  {analysis.riskLevel} risk
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "10px",
                  marginTop: "14px",
                }}
              >
                {analysis.metrics.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      borderRadius: "var(--radius-xs)",
                      padding: "10px 12px",
                      background: "color-mix(in srgb, var(--bg) 55%, transparent)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div style={{ fontSize: "0.6875rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: toneColor(m.tone) }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI streaming area */}
          {state.status === "loading-ai" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                fontSize: "0.875rem",
                color: "var(--text-2)",
              }}
            >
              <Loader2 size={18} className="animate-spin" style={{ flexShrink: 0 }} />
              Preparing your analysis…
            </div>
          )}

          {(streaming || state.status === "done") && (
            <div
              style={{
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--glass-border)",
                background: "var(--glass-bg)",
                padding: "18px",
                fontSize: "0.9rem",
                lineHeight: 1.7,
                color: "var(--text-1)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {aiText}
              {streaming && <span style={{ color: "var(--accent)" }}>▍</span>}
            </div>
          )}

          {/* Footer disclaimer */}
          <p
            style={{
              marginTop: "16px",
              fontSize: "0.75rem",
              lineHeight: 1.6,
              color: "var(--text-3)",
            }}
          >
            This tool is for education and decision support only. It is not financial
            advice, a recommendation to buy or sell, or a guarantee of any outcome.
            Markets are volatile — always do your own research.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
