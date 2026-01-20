export default function TrafficChartCard({ chartRef, isRefreshing, onRefresh }) {
  return (
    <div className="chart-card">
      <div className="chart-head">
        <h2>Traffic split</h2>
        <button
          type="button"
          className="ghost-button"
          onClick={() => onRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh now"}
        </button>
      </div>
      <svg ref={chartRef} className="chart" role="img" />
    </div>
  );
}
