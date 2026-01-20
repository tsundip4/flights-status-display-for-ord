export default function ManualFetchCard({
  limit,
  onLimitChange,
  onFetch,
  isRefreshing,
}) {
  return (
    <div className="summary-card action-card">
      <h3>Manual fetch</h3>
      <p>Pull the latest ORD board instantly.</p>
      <div className="action-row">
        <label>
          Limit
          <input
            type="number"
            min="5"
            max="100"
            placeholder="25"
            value={Number.isNaN(limit) ? "" : limit}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              onLimitChange(Number.isNaN(nextValue) ? 25 : nextValue);
            }}
          />
        </label>
        <button type="button" onClick={() => onFetch()} disabled={isRefreshing}>
          Fetch now
        </button>
      </div>
    </div>
  );
}
