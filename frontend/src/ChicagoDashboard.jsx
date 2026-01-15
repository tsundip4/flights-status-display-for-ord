import { useEffect, useMemo, useRef, useState } from "react";
import { renderArrivalsDeparturesChart } from "./d3/arrivalsDeparturesChart.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const AIRPORT = "ORD";
const POLL_INTERVAL_MS = 3600000;

function formatTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString([], { month: "short", day: "2-digit" });
}

function ChicagoDashboard() {
  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [limit, setLimit] = useState(25);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(
        `${API_BASE}/flights/aviationstack/${AIRPORT}?limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Unable to fetch Aviationstack data.");
      }
      const payload = await response.json();
      setDepartures(payload.departures || []);
      setArrivals(payload.arrivals || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [limit]);

  const summaryData = useMemo(
    () => [
      { label: "Departures", value: departures.length },
      { label: "Arrivals", value: arrivals.length },
    ],
    [departures.length, arrivals.length]
  );

  useEffect(() => {
    if (!chartRef.current) return;
    renderArrivalsDeparturesChart(chartRef.current, summaryData);
  }, [summaryData]);

  return (
    <div className="dashboard">
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

      {error ? <div className="error-banner">{error}</div> : null}

      <section className="summary">
        <div className="summary-card highlight">
          <span className="label">Departures</span>
          <span className="value">{departures.length}</span>
          <span className="meta">Next scheduled window</span>
        </div>
        <div className="summary-card highlight">
          <span className="label">Arrivals</span>
          <span className="value">{arrivals.length}</span>
          <span className="meta">Inbound activity</span>
        </div>
        <div className="chart-card">
          <div className="chart-head">
            <h2>Traffic split</h2>
            <button
              type="button"
              className="ghost-button"
              onClick={fetchData}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh now"}
            </button>
          </div>
          <svg ref={chartRef} className="chart" role="img" />
        </div>
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
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
              />
            </label>
            <button type="button" onClick={fetchData} disabled={isRefreshing}>
              Fetch now
            </button>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Departures</h2>
            <span className="pill">{departures.length} flights</span>
          </div>
          <div className="flight-list">
            {departures.length === 0 ? (
              <p className="empty">No departures found.</p>
            ) : (
              departures.map((flight) => (
                <article key={flight.flight_number} className="flight-card">
                  <div className="flight-head">
                    <div>
                      <strong>{flight.flight_number}</strong>
                      <span>{flight.airline}</span>
                    </div>
                    <span className="badge">{flight.status}</span>
                  </div>
                  <div className="flight-body">
                    <span>To {flight.destination}</span>
                    <span>
                      {formatDate(flight.scheduled)} {formatTime(flight.scheduled)}
                    </span>
                    <span>
                      Terminal {flight.terminal || "--"} • Gate {flight.gate || "--"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Arrivals</h2>
            <span className="pill">{arrivals.length} flights</span>
          </div>
          <div className="flight-list">
            {arrivals.length === 0 ? (
              <p className="empty">No arrivals found.</p>
            ) : (
              arrivals.map((flight) => (
                <article key={flight.flight_number} className="flight-card">
                  <div className="flight-head">
                    <div>
                      <strong>{flight.flight_number}</strong>
                      <span>{flight.airline}</span>
                    </div>
                    <span className="badge">{flight.status}</span>
                  </div>
                  <div className="flight-body">
                    <span>From {flight.origin}</span>
                    <span>
                      {formatDate(flight.scheduled)} {formatTime(flight.scheduled)}
                    </span>
                    <span>
                      Terminal {flight.terminal || "--"} • Gate {flight.gate || "--"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ChicagoDashboard;
