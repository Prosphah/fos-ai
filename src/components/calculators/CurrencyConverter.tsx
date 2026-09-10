"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpDown } from "lucide-react";

import { inputStyle, labelStyle, useAnimatedNumber, useFocusStyle } from "./calculator-primitives";

const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
] as const;

type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const FALLBACK_RATES: Record<CurrencyCode, number> = {
  NGN: 1,
  USD: 1550,
  GBP: 1950,
  EUR: 1700,
};

function formatAmount(value: number, code: CurrencyCode): string {
  if (code === "NGN") {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState<number>(0);
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>("NGN");
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("USD");
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(FALLBACK_RATES);
  const [rateSource, setRateSource] = useState<"live" | "fallback">("fallback");
  const [loading, setLoading] = useState(false);

  const amountFocus = useFocusStyle();

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    async function fetchRates() {
      setLoading(true);
      try {
        const res = await fetch(
          "https://api.exchangerate-api.com/v4/latest/NGN",
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Failed to fetch rates");
        const data = await res.json();
        setRates({
          NGN: 1,
          USD: data.rates.USD ? 1 / data.rates.USD : FALLBACK_RATES.USD,
          GBP: data.rates.GBP ? 1 / data.rates.GBP : FALLBACK_RATES.GBP,
          EUR: data.rates.EUR ? 1 / data.rates.EUR : FALLBACK_RATES.EUR,
        });
        setRateSource("live");
      } catch {
        setRates(FALLBACK_RATES);
        setRateSource("fallback");
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }
    void fetchRates();
    return () => {
      // Abort stale requests when the component unmounts or the effect reruns.
      controller.abort();
    };
  }, []);

  const converted = amount * (rates[fromCurrency] / rates[toCurrency]);
  const animConverted = useAnimatedNumber(converted, 400);

  const rate = rates[fromCurrency] / rates[toCurrency];

  const handleSwap = useCallback(() => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }, [fromCurrency, toCurrency]);

  const getSymbol = (code: CurrencyCode) =>
    CURRENCIES.find((c) => c.code === code)?.symbol ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* From */}
      <div>
        <label style={labelStyle}>From</label>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "1rem",
                fontWeight: 600,
                color: "var(--text-3)",
                pointerEvents: "none",
              }}
            >
              {getSymbol(fromCurrency)}
            </span>
            <input
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              inputMode="decimal"
              style={{
                ...inputStyle,
                paddingLeft: "32px",
                fontSize: "1.25rem",
                fontWeight: 700,
                minHeight: "52px",
                border: amountFocus.border,
                boxShadow: amountFocus.shadow,
              }}
              {...amountFocus.bind}
            />
          </div>
          <select
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: "100px",
              cursor: "pointer",
              appearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "32px",
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap button */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={handleSwap}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s var(--ease)",
            color: "var(--accent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--accent-soft)";
            e.currentTarget.style.transform = "rotate(180deg)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--glass-bg)";
            e.currentTarget.style.transform = "rotate(0deg)";
          }}
        >
          <ArrowUpDown size={18} />
        </button>
      </div>

      {/* To */}
      <div>
        <label style={labelStyle}>To</label>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <div
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              fontSize: "1.25rem",
              fontWeight: 700,
              minHeight: "52px",
              display: "flex",
              alignItems: "center",
              color: "var(--text-1)",
            }}
          >
            {amount > 0
              ? `${getSymbol(toCurrency)} ${formatAmount(animConverted, toCurrency)}`
              : `${getSymbol(toCurrency)} 0`}
          </div>
          <select
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
            style={{
              ...inputStyle,
              width: "auto",
              minWidth: "100px",
              cursor: "pointer",
              appearance: "none" as const,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: "32px",
            }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rate info */}
      <div
        style={{
          borderRadius: "var(--radius)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--text-2)" }}>
            Exchange rate
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            1 {fromCurrency} = {rate < 0.01 ? rate.toFixed(6) : rate < 1 ? rate.toFixed(4) : rate.toFixed(2)}{" "}
            {toCurrency}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--text-2)" }}>
            Rate source
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono-family)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: rateSource === "live" ? "var(--mint)" : "var(--text-3)",
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: rateSource === "live" ? "var(--mint-soft)" : "var(--glass-bg)",
              letterSpacing: "0.02em",
            }}
          >
            {loading ? "Fetching..." : rateSource === "live" ? "LIVE" : "Estimate"}
          </span>
        </div>
      </div>
    </div>
  );
}
