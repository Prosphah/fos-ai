"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompactValue } from "@/lib/format";
import type { ChartDataPoint } from "@/services/financial-health.service";

interface Props {
  data: ChartDataPoint[];
  value: string;
  trend: string;
  currency?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
  currency = "USD",
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        borderRadius: "var(--radius-xs)",
        border: "1px solid var(--glass-border)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        padding: "8px 12px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: "var(--text-3)" }}>
        {label}
      </p>
      <p style={{ marginTop: "2px", fontSize: "0.875rem", fontWeight: 700, color: "var(--text-1)" }}>
        {formatCompactValue(payload[0].value, currency)}
      </p>
    </div>
  );
}

export function ChartCard({ data, trend, currency = "USD" }: Props) {
  if (!data.length) return null;

  return (
    <div
      className="glass"
      style={{ padding: "18px", overflow: "hidden" }}
    >
      {/* Header — title left, delta pill right (mockup3 .chart-header) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.625rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Net Worth Trend
        </span>

        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--mint)",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "3px 8px",
            borderRadius: "var(--radius-full)",
            background: "var(--mint-soft)",
          }}
        >
          <span
            style={{
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              background: "currentColor",
              flexShrink: 0,
            }}
          />
          {trend}
        </span>
      </div>
<p
        style={{
          fontSize: "0.625rem",
          color: "var(--text-3)",
          marginTop: "4px",
        }}
      >
        Card: Net worth at end of period. Graph: Overall trend across all periods shown.
      </p>
      <div style={{ width: "100%", height: "120px" }} className="lg:!h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--text-3)", fontFamily: "var(--font-mono-family)" }}
              dy={8}
            />
            <YAxis hide />
            <Tooltip
              content={<CustomTooltip currency={currency} />}
              cursor={{
                stroke: "var(--accent)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "var(--accent)",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
