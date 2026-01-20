export default function DashboardHeader({ lastUpdated }) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">Chicago Airport Live Board</p>
        <h1>ORD arrivals & departures</h1>
        <p className="subhead">
          Live snapshots from Aviationstack for O'Hare International Airport.
        </p>
      </div>
      <div className="meta-card">
        <div>
          <span className="label">Airport</span>
          <span className="value">ORD</span>
        </div>
        <div>
          <span className="label">Last update</span>
          <span className="value">
            {lastUpdated
              ? lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "--"}
          </span>
        </div>
      </div>
    </header>
  );
}
