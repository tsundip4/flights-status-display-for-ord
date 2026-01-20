import ManualFetchCard from "./ManualFetchCard";
import TrafficChartCard from "./TrafficChartCard";

export default function ControlsSection({
  chartRef,
  isRefreshing,
  onRefresh,
  limit,
  onLimitChange,
  onFetch,
}) {
  return (
    <section className="controls">
      <TrafficChartCard
        chartRef={chartRef}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />
      <ManualFetchCard
        limit={limit}
        onLimitChange={onLimitChange}
        onFetch={onFetch}
        isRefreshing={isRefreshing}
      />
    </section>
  );
}
