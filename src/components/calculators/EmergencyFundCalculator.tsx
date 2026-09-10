"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Shield } from "lucide-react";
import {
  CHART_H,
  CHART_W,
  buildPoints,
  formatCurrency,
  inputStyle,
  labelStyle,
  useAnimatedNumber,
  useFocusStyle,
} from "./calculator-primitives";

function formatMonthsShort(months: number): string {
  if (months === Infinity) return "—";
  const y = Math.floor(months / 12);
  const m = Math.round(months % 12);
  if (y === 0) return `${m} month${m !== 1 ? "s" : ""}`;
  if (m === 0) return `${y} year${y !== 1 ? "s" : ""}`;
  return `${y} year${y !== 1 ? "s" : ""}, ${m} month${m !== 1 ? "s" : ""}`;
}

export function EmergencyFundCalculator() {
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [currentSavings, setCurrentSavings] = useState<number>(0);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(0);

  const expensesFocus = useFocusStyle();
  const savingsFocus = useFocusStyle();
  const contributionFocus = useFocusStyle();

  const calc = useMemo(() => {
    if (monthlyExpenses <= 0) return null;

    const target6 = monthlyExpenses * 6;
    const target12 = monthlyExpenses * 12;
    const gap6 = Math.max(0, target6 - currentSavings);
    const gap12 = Math.max(0, target12 - currentSavings);

    const monthsTo6 = monthlyContribution > 0 ? Math.ceil(gap6 / monthlyContribution) : Infinity;
    const monthsTo12 = monthlyContribution > 0 ? Math.ceil(gap12 / monthlyContribution) : Infinity;

    const coverageMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0;

    const steps = 24;
    const chartMonths = Number.isFinite(monthsTo6) ? Math.max(monthsTo6, 1) : 24;
    const target = target6;
    const values: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const m = i * (chartMonths / steps);
      values.push(Math.min(target, currentSavings + monthlyContribution * m));
    }

    return {
      target6,
      target12,
      gap6,
      gap12,
      monthsTo6,
      monthsTo12,
      coverageMonths,
      values,
    };
  }, [monthlyExpenses, currentSavings, monthlyContribution]);

  const animCurrent = useAnimatedNumber(currentSavings);
  const animTarget = useAnimatedNumber(calc?.target6 ?? 0);

  const chartKey = `${monthlyExpenses}-${currentSavings}-${monthlyContribution}`;

  const points = useMemo(() => {
    if (!calc || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H);
  }, [calc]);

  const hasInput = monthlyExpenses > 0 || currentSavings > 0 || monthlyContribution > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Monthly Expenses</label>
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
            value={monthlyExpenses}
            onChange={setMonthlyExpenses}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: expensesFocus.border,
              boxShadow: expensesFocus.shadow,
            }}
            {...expensesFocus.bind}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Current Emergency Savings</label>
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
            value={currentSavings}
            onChange={setCurrentSavings}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              border: savingsFocus.border,
              boxShadow: savingsFocus.shadow,
            }}
            {...savingsFocus.bind}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Monthly Contribution</label>
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
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              border: contributionFocus.border,
              boxShadow: contributionFocus.shadow,
            }}
            {...contributionFocus.bind}
          />
        </div>
      </div>

      {calc ? (
        <div
          key={chartKey}
          style={{
            borderRadius: "var(--radius)",
            border: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "20px",
            overflow: "hidden",
            animation: "calculatorReveal 0.5s var(--ease-spring) both",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-60%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "220px",
              height: "220px",
              background: "radial-gradient(circle, var(--accent-soft), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative" }}>
            <p
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "6px",
              }}
            >
              6-Month Target
            </p>
            <p
              style={{
                fontFamily: "var(--font-display-family)",
                fontSize: "1.875rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-1)",
                lineHeight: 1.1,
              }}
            >
              {formatCurrency(Math.round(animTarget))}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-2)",
                marginTop: "4px",
              }}
            >
              {calc.coverageMonths >= 6
                ? "You're already covered!"
                : calc.coverageMonths > 0
                  ? `${Math.floor(calc.coverageMonths)} of 6 months covered`
                  : "No emergency savings yet"}
            </p>
          </div>

          {monthlyContribution > 0 && Number.isFinite(calc.monthsTo6) && points && (
            <>
              <p
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginTop: "16px",
                  marginBottom: "8px",
                }}
              >
                Savings growth over time
              </p>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                style={{
                  width: "100%",
                  height: "90px",
                  marginBottom: "8px",
                  display: "block",
                  overflow: "visible",
                }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="efFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#efFill)"
                  style={{ animation: "calculatorFade 0.8s var(--ease) both" }}
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={100}
                  style={{
                    strokeDasharray: 100,
                    animation: "calculatorDraw 0.9s var(--ease-spring) both",
                  }}
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.625rem",
                  color: "var(--text-3)",
                  padding: "0 2px",
                }}
              >
                <span>Today</span>
                <span>
                  {calc.monthsTo6 === Infinity
                    ? "Set contribution"
                    : `Target: ${formatMonthsShort(calc.monthsTo6)}`}
                </span>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: "14px",
              borderTop: "1px solid var(--glass-border)",
              paddingTop: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
                Current savings
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {formatCurrency(Math.round(animCurrent))}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.875rem", color: "var(--text-2)" }}>
                Remaining to save
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {formatCurrency(Math.round(calc.gap6))}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            borderRadius: "var(--radius)",
            border: "1px dashed var(--glass-border)",
            background: "var(--glass-bg)",
            padding: "28px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--accent-soft)",
              color: "var(--accent)",
            }}
          >
            <Shield size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {hasInput ? "Almost there" : "Build your safety net"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {hasInput
              ? "Enter your monthly expenses to see the full picture."
              : "Calculate how much you need for 6-12 months of expenses."}
          </p>
        </div>
      )}

    </div>
  );
}
