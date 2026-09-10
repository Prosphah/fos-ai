"use client";

import { useMemo, useState } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Receipt } from "lucide-react";

const labelStyle = {
  fontFamily: "var(--font-mono-family)",
  fontSize: "0.6875rem",
  fontWeight: 600 as const,
  color: "var(--text-3)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.1em",
  marginBottom: "8px",
};

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "12px 14px",
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--glass-border)",
  background: "var(--glass-bg)",
  fontSize: "0.875rem",
  color: "var(--text-1)",
  outline: "none",
  minHeight: "44px",
  transition: "border-color 0.2s var(--ease), box-shadow 0.2s var(--ease)",
} as const;

function useFocusStyle() {
  const [focused, setFocused] = useState(false);
  const bind = {
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
  };
  const border = focused
    ? "1px solid var(--accent)"
    : "1px solid var(--glass-border)";
  const shadow = focused ? "0 0 0 3px var(--accent-softer)" : "none";
  return { bind, border, shadow };
}

const TAX_BANDS = [
  { limit: 800_000, rate: 0 },
  { limit: 2_200_000, rate: 0.15 },
  { limit: 9_000_000, rate: 0.18 },
  { limit: 13_000_000, rate: 0.21 },
  { limit: 25_000_000, rate: 0.23 },
  { limit: Infinity, rate: 0.25 },
] as const;

const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

function calculateTax(
  annualGross: number,
  pensionRate: number | "",
  nhisRate: number | ""
) {
  const pensionRelief = annualGross * (Number(pensionRate) / 100);
  const nhisRelief = annualGross * (Number(nhisRate) / 100);
  const consolidatedRelief = Math.max(200_000, annualGross * 0.01) + annualGross * 0.2;
  const taxableIncome = Math.max(
    0,
    annualGross - pensionRelief - nhisRelief - consolidatedRelief
  );

  let remaining = taxableIncome;
  let lowerBound = 0;
  const breakdown = TAX_BANDS.map((band) => {
    const width = band.limit === Infinity ? remaining : band.limit;
    const taxableAmount = Math.max(0, Math.min(remaining, width));
    const tax = taxableAmount * band.rate;
    remaining -= taxableAmount;
    const row = {
      label: `${formatNaira(lowerBound)} - ${band.limit === Infinity ? "above" : formatNaira(band.limit)}`,
      rate: band.rate,
      taxableAmount,
      tax,
    };
    lowerBound = band.limit;
    return row;
  }).filter((band) => band.taxableAmount > 0 || band.rate === 0);

  const annualTax = breakdown.reduce((sum, band) => sum + band.tax, 0);
  return {
    annualGross,
    pensionRelief,
    nhisRelief,
    consolidatedRelief,
    taxableIncome,
    annualTax,
    monthlyTax: annualTax / 12,
    monthlyNet: (annualGross - annualTax) / 12,
    effectiveRate: annualGross > 0 ? (annualTax / annualGross) * 100 : 0,
    breakdown,
  };
}

export function TaxCalculator() {
  const [grossIncome, setGrossIncome] = useState<number>(0);
  const [pension, setPension] = useState<number | "">(8);
  const [nhis, setNhis] = useState<number | "">(5);

  const incomeFocus = useFocusStyle();
  const pensionFocus = useFocusStyle();
  const nhisFocus = useFocusStyle();

  const calculation = useMemo(
    () => calculateTax(grossIncome * 12, pension, nhis),
    [grossIncome, pension, nhis]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          borderRadius: "var(--radius)",
          border: "1px dashed var(--accent)",
          background: "var(--accent-soft)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}
      >
        <Receipt
          size={18}
          style={{ color: "var(--accent)", flexShrink: 0, marginTop: "2px" }}
        />
        <div>
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--text-1)",
              marginBottom: "2px",
            }}
          >
            2026 Nigerian income-tax estimate
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-2)" }}>
            Works as an estimate for employees, freelancers, contractors, and
            other earners. Enter gross monthly income and eligible reliefs.
          </p>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Gross Monthly Income</label>
        <div style={{ position: "relative", marginTop: "8px" }}>
          <span
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          >
            ₦
          </span>
          <CurrencyInput
            value={grossIncome}
            onChange={setGrossIncome}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: incomeFocus.border,
              boxShadow: incomeFocus.shadow,
            }}
            {...incomeFocus.bind}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Pension Contribution (%)</label>
        <div style={{ position: "relative", marginTop: "8px" }}>
          <input
            type="number"
            value={pension}
            onChange={(e) => {
              const value = e.target.value;
              setPension(value === "" ? "" : Math.min(100, Math.max(0, Number(value))));
            }}
            placeholder="8"
            inputMode="decimal"
            style={{
              ...inputStyle,
              paddingRight: "34px",
              border: pensionFocus.border,
              boxShadow: pensionFocus.shadow,
            }}
            {...pensionFocus.bind}
          />
          <span
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.875rem",
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          >
            %
          </span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>NHIS Contribution (%)</label>
        <div style={{ position: "relative", marginTop: "8px" }}>
          <input
            type="number"
            value={nhis}
            onChange={(e) => {
              const value = e.target.value;
              setNhis(value === "" ? "" : Math.min(100, Math.max(0, Number(value))));
            }}
            placeholder="5"
            inputMode="decimal"
            style={{
              ...inputStyle,
              paddingRight: "34px",
              border: nhisFocus.border,
              boxShadow: nhisFocus.shadow,
            }}
            {...nhisFocus.bind}
          />
          <span
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.875rem",
              color: "var(--text-3)",
              pointerEvents: "none",
            }}
          >
            %
          </span>
        </div>
      </div>

      <div
        style={{
          borderRadius: "var(--radius)",
          border: "1px solid var(--glass-border)",
          background: "var(--glass-bg)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
          {[
            ["Annual tax", formatNaira(calculation.annualTax)],
            ["Monthly net", formatNaira(calculation.monthlyNet)],
            ["Taxable income", formatNaira(calculation.taxableIncome)],
            ["Effective rate", `${calculation.effectiveRate.toFixed(1)}%`],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--accent-soft)" }}>
              <p style={{ fontSize: "0.6875rem", color: "var(--text-3)" }}>{label}</p>
              <p style={{ marginTop: "4px", fontSize: "1rem", fontWeight: 700, color: "var(--text-1)" }}>{grossIncome > 0 ? value : "—"}</p>
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-1)", marginBottom: "8px" }}>Annual reliefs</p>
          {[
            ["Consolidated relief allowance", calculation.consolidatedRelief],
            ["Pension relief", calculation.pensionRelief],
            ["NHIS relief", calculation.nhisRelief],
          ].map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "0.75rem", color: "var(--text-2)", marginTop: "5px" }}>
              <span>{label}</span><span>{grossIncome > 0 ? formatNaira(value as number) : "—"}</span>
            </div>
          ))}
        </div>

        <div>
          <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-1)", marginBottom: "8px" }}>Progressive tax bands</p>
          {calculation.breakdown.map((band) => (
            <div key={band.label} style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "0.75rem", color: "var(--text-2)", marginTop: "5px" }}>
              <span>{band.label} at {(band.rate * 100).toFixed(0)}%</span><span>{grossIncome > 0 ? formatNaira(band.tax) : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
