import { SnapshotMetric } from "@/services/financial-health.service";

interface Props {
  metric: SnapshotMetric;
}

export function SnapshotCard({ metric }: Props) {
  return (
    <div
      className="glass"
      style={{ padding: "18px", overflow: "hidden" }}
    >
      {/* Label */}
      <p
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: "0.625rem",
          fontWeight: 600,
          color: "var(--text-3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "10px",
        }}
      >
        {metric.title}
      </p>

      {/* Value — smaller on mobile to fit compact currency */}
      <span
        style={{
          fontFamily: "var(--font-display-family)",
          fontWeight: 700,
          fontSize: "1.0625rem",
          letterSpacing: "-0.02em",
          color: "var(--text-1)",
          display: "block",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        className="sm:!text-[1.125rem] lg:!text-[1.25rem]"
      >
        {metric.value}
      </span>

      {/* Delta — below value, matching mockup3 .metric-delta */}
      <span
        style={{
          fontFamily: "var(--font-mono-family)",
          fontSize: "0.625rem",
          fontWeight: 600,
          marginTop: "6px",
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
  );
}
