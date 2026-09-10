"use client";

import { useState, useMemo } from "react";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ArrowDownRight } from "lucide-react";
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

export function InflationCalculator() {
  const [amount, setAmount] = useState<number>(0);
  const [inflationRate, setInflationRate] = useState<number>(0);
  const [years, setYears] = useState<number>(0);

  const amountFocus = useFocusStyle();
  const rateFocus = useFocusStyle();
  const yearsFocus = useFocusStyle();

  const calc = useMemo(() => {
    if (amount <= 0 || years <= 0 || inflationRate <= 0) return null;

    const realValue = amount / Math.pow(1 + inflationRate / 100, years);
    const purchasingPowerLoss = amount - realValue;
    const lossPercentage = (purchasingPowerLoss / amount) * 100;

    const steps = Math.min(Math.ceil(years), 60);
    const values: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * years;
      values.push(amount / Math.pow(1 + inflationRate / 100, t));
    }

    return { realValue, purchasingPowerLoss, lossPercentage, values };
  }, [amount, inflationRate, years]);

  const animReal = useAnimatedNumber(calc?.realValue ?? 0);
  const animLoss = useAnimatedNumber(calc?.purchasingPowerLoss ?? 0);

  const chartKey = `${amount}-${inflationRate}-${years}`;

  const points = useMemo(() => {
    if (!calc || calc.values.length < 2) return "";
    return buildPoints(calc.values, CHART_W, CHART_H);
  }, [calc]);

  const hasInput = amount > 0 || inflationRate > 0 || years > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <label style={labelStyle}>Current Amount</label>
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
            value={amount}
            onChange={setAmount}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: "38px",
              fontSize: "1.5rem",
              fontWeight: 700,
              minHeight: "56px",
              border: amountFocus.border,
              boxShadow: amountFocus.shadow,
            }}
            {...amountFocus.bind}
          />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <div>
          <label style={labelStyle}>Inflation Rate</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={inflationRate || ""}
              onChange={(e) =>
                setInflationRate(Math.min(100, Math.max(0, Number(e.target.value))))
              }
              placeholder="0"
              inputMode="decimal"
              style={{
                ...inputStyle,
                paddingRight: "34px",
                border: rateFocus.border,
                boxShadow: rateFocus.shadow,
              }}
              {...rateFocus.bind}
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
          <label style={labelStyle}>Years</label>
          <div style={{ position: "relative", marginTop: "8px" }}>
            <input
              type="number"
              value={years || ""}
              onChange={(e) => setYears(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              inputMode="numeric"
              style={{
                ...inputStyle,
                border: yearsFocus.border,
                boxShadow: yearsFocus.shadow,
              }}
              {...yearsFocus.bind}
            />
          </div>
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
              background: "radial-gradient(circle, var(--rose-soft), transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              position: "relative",
            }}
          >
            <div>
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
                Future Purchasing Power
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
                {formatCurrency(Math.round(animReal))}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-2)",
                  marginTop: "4px",
                }}
              >
                Worth {calc.lossPercentage.toFixed(1)}% less in {years} years
              </p>
            </div>

            <span
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.8125rem",
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                letterSpacing: "0.02em",
                background: "var(--rose-soft)",
                color: "var(--rose)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ArrowDownRight size={13} />
              -{calc.lossPercentage.toFixed(1)}%
            </span>
          </div>

          {points && (
            <>
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                style={{
                  width: "100%",
                  height: "90px",
                  marginTop: "16px",
                  marginBottom: "8px",
                  display: "block",
                  overflow: "visible",
                }}
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="infFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--rose)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--rose)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,${CHART_H} ${points} ${CHART_W},${CHART_H}`}
                  fill="url(#infFill)"
                  style={{ animation: "calculatorFade 0.8s var(--ease) both" }}
                />
                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--rose)"
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
                <span>Now</span>
                <span>{years}y</span>
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
                Today&apos;s value
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                {formatCurrency(amount)}
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
                Purchasing power lost
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono-family)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--rose)",
                }}
              >
                -{formatCurrency(Math.round(animLoss))}
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
            <ArrowDownRight size={18} />
          </div>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--text-1)",
            }}
          >
            {hasInput ? "Almost there" : "See inflation's impact"}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-2)", maxWidth: "240px" }}>
            {hasInput
              ? "Enter all values to see how inflation erodes your money."
              : "See how much your money will be worth in the future."}
          </p>
        </div>
      )}

    </div>
  );
}
