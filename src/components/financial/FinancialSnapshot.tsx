import { SnapshotCard } from "./SnapshotCard";
import { ChartCard } from "./ChartCard";
import type { BriefingData } from "@/services/financial-health.service";

interface Props {
  data: BriefingData;
}

export function FinancialSnapshot({ data }: Props) {
  const { metrics, chartData, chartValue, chartTrend, currency } = data;

  if (metrics.length < 4) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        alignItems: "start",
      }}
      className="lg:!grid-cols-4 lg:!grid-rows-[auto_auto]"
    >
      {/* 4 metric cards — row 1 */}
      <SnapshotCard metric={metrics[0]} />
      <SnapshotCard metric={metrics[1]} />
      <SnapshotCard metric={metrics[2]} />
      <SnapshotCard metric={metrics[3]} />

      {/* Chart card — row 2, full width */}
      <div style={{ gridColumn: "1 / -1" }}>
        <ChartCard
          data={chartData}
          value={chartValue}
          trend={chartTrend}
          currency={currency}
        />
      </div>
    </div>
  );
}
