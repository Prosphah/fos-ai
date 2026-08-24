import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { SnapshotMetric } from "@/services/financial-health.service";

const icons = {
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  wallet: Wallet,
  "arrow-up-right": ArrowUpRight,
};

interface Props {
  metric: SnapshotMetric;
}

export function MetricCard({ metric }: Props) {
  const Icon = icons[metric.icon];

  return (
    <div className="glass" style={{ padding: "18px" }}>
      <div className="flex items-center justify-between">
        <p
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.625rem",
            fontWeight: 600,
            color: "var(--text-3)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {metric.title}
        </p>
        {Icon && (
          <Icon
            size={14}
            style={{ color: metric.positive ? "var(--accent)" : "var(--rose)" }}
          />
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span
          style={{
            fontFamily: "var(--font-display-family)",
            fontWeight: 700,
            fontSize: "1.25rem",
            letterSpacing: "-0.02em",
            color: "var(--text-1)",
          }}
        >
          {metric.value}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono-family)",
            fontSize: "0.625rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "var(--radius-full)",
            background: metric.positive ? "var(--mint-soft)" : "var(--rose-soft)",
            color: metric.positive ? "var(--mint)" : "var(--rose)",
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
          {metric.trend}
        </span>
      </div>
    </div>
  );
}
