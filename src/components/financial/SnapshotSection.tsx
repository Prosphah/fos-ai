"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { fetchSnapshotByPeriod } from "@/app/actions/snapshot";
import { FinancialSnapshot } from "./FinancialSnapshot";
import type { BriefingData, SnapshotPeriod, SnapshotMetric, ChartDataPoint } from "@/services/financial-health.service";

interface Props {
  userId: string;
  initialData: BriefingData;
}

const periods: { label: string; value: SnapshotPeriod }[] = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Annually", value: "annually" },
];

export function SnapshotSection({ userId, initialData }: Props) {
  const [period, setPeriod] = useState<SnapshotPeriod>("monthly");
  const [data, setData] = useState<{
    metrics: SnapshotMetric[];
    chartData: ChartDataPoint[];
    chartValue: string;
    chartTrend: string;
    currency: string;
  }>({
    metrics: initialData.metrics,
    chartData: initialData.chartData,
    chartValue: initialData.chartValue,
    chartTrend: initialData.chartTrend,
    currency: initialData.currency,
  });
  const [isPending, startTransition] = useTransition();
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = ++requestVersion.current;
    startTransition(async () => {
      const result = await fetchSnapshotByPeriod(userId, period);
      if (version === requestVersion.current) setData(result);
    });
  }, [initialData, userId]); // eslint-disable-line react-hooks/exhaustive-deps -- period requests are guarded in handlePeriodChange

  function handlePeriodChange(newPeriod: SnapshotPeriod) {
    if (newPeriod === period) return;
    setPeriod(newPeriod);
    const version = ++requestVersion.current;
    startTransition(async () => {
      const result = await fetchSnapshotByPeriod(userId, newPeriod);
      if (version === requestVersion.current) setData(result);
    });
  }

  return (
    <section>
      {/* Eyebrow + filter on same line */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.6875rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          Financial Snapshot
        </p>

        {/* Period filter pills */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            padding: "3px",
            borderRadius: "var(--radius-full)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
          }}
        >
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePeriodChange(p.value)}
              style={{
                fontFamily: "var(--font-mono-family)",
                fontSize: "0.625rem",
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s var(--ease)",
                background: period === p.value ? "var(--accent)" : "transparent",
                color: period === p.value ? "#fff" : "var(--text-3)",
                letterSpacing: "0.02em",
                opacity: isPending && period === p.value ? 0.7 : 1,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}>
        <FinancialSnapshot
          data={{
            ...initialData,
            metrics: data.metrics,
            chartData: data.chartData,
            chartValue: data.chartValue,
            chartTrend: data.chartTrend,
            currency: data.currency,
          }}
        />
      </div>
    </section>
  );
}
