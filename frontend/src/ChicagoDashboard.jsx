import { useEffect, useMemo, useRef, useState } from "react";
import { renderArrivalsDeparturesChart } from "./d3/arrivalsDeparturesChart.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const AIRPORT = "ORD";
const POLL_INTERVAL_MS = 3600000;
const ORD_COORDS = { latitude: 41.9742, longitude: -87.9073 };

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
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [limit, setLimit] = useState(25);
  const chartRef = useRef(null);
  const mapRef = useRef(null);
  const mapViewRef = useRef(null);
  const ordGraphicRef = useRef(null);

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
    const timer = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const now = Date.now();
  const next24hCutoff = now + 24 * 60 * 60 * 1000;

  const departuresNext24h = useMemo(
    () =>
      departures.filter((flight) => {
        if (!flight.scheduled) return false;
        const scheduledTime = new Date(flight.scheduled).getTime();
        return scheduledTime >= now && scheduledTime <= next24hCutoff;
      }).length,
    [departures, now, next24hCutoff]
  );

  const arrivalsNext24h = useMemo(
    () =>
      arrivals.filter((flight) => {
        if (!flight.scheduled) return false;
        const scheduledTime = new Date(flight.scheduled).getTime();
        return scheduledTime >= now && scheduledTime <= next24hCutoff;
      }).length,
    [arrivals, now, next24hCutoff]
  );

  const totalFlightsNext24h = departuresNext24h + arrivalsNext24h;

  const summaryData = useMemo(
    () => [
      { label: "Departures", value: departuresNext24h },
      { label: "Arrivals", value: arrivalsNext24h },
    ],
    [departuresNext24h, arrivalsNext24h]
  );

  const latestFlights = useMemo(() => {
    const normalize = (flight, type) => ({
      ...flight,
      type,
      scheduledTime: flight.scheduled ? new Date(flight.scheduled).getTime() : 0,
    });
    const combined = [
      ...departures.map((flight) => normalize(flight, "Departure")),
      ...arrivals.map((flight) => normalize(flight, "Arrival")),
    ];
    return combined
      .sort((a, b) => b.scheduledTime - a.scheduledTime)
      .slice(0, 20);
  }, [departures, arrivals]);

  useEffect(() => {
    if (!chartRef.current) return;
    renderArrivalsDeparturesChart(chartRef.current, summaryData);
  }, [summaryData]);

  useEffect(() => {
    let view;

    const initMap = async () => {
      if (!mapRef.current || mapViewRef.current) return;
      const [{ default: ArcGISMap }, { default: MapView }, { default: Graphic }, { default: esriConfig }] =
        await Promise.all([
          import("@arcgis/core/Map"),
          import("@arcgis/core/views/MapView"),
          import("@arcgis/core/Graphic"),
          import("@arcgis/core/config"),
        ]);

      const apiKey = import.meta.env.VITE_ARCGIS_API_KEY;
      if (apiKey) {
        esriConfig.apiKey = apiKey;
      }

      const map = new ArcGISMap({
        basemap: apiKey ? "arcgis-light-gray" : "osm",
      });
      view = new MapView({
        container: mapRef.current,
        map,
        center: [ORD_COORDS.longitude, ORD_COORDS.latitude],
        zoom: 9,
      });

      const ordGraphic = new Graphic({
        geometry: {
          type: "point",
          longitude: ORD_COORDS.longitude,
          latitude: ORD_COORDS.latitude,
        },
        symbol: {
          type: "simple-marker",
          color: "#d2774a",
          size: 12,
          outline: {
            color: "#ffffff",
            width: 2,
          },
        },
        attributes: {
          departures: summaryData[0].value,
          arrivals: summaryData[1].value,
        },
        popupTemplate: {
          title: "ORD — Chicago O'Hare",
          content:
            "Departures: {departures}<br/>Arrivals: {arrivals}<br/>Click refresh to update.",
        },
      });

      view.graphics.add(ordGraphic);
      mapViewRef.current = view;
      ordGraphicRef.current = ordGraphic;
    };

    initMap();

    return () => {
      if (view) {
        view.destroy();
      }
      mapViewRef.current = null;
      ordGraphicRef.current = null;
    };
  }, [summaryData]);

  useEffect(() => {
    if (ordGraphicRef.current) {
      ordGraphicRef.current.attributes = {
        departures: summaryData[0].value,
        arrivals: summaryData[1].value,
      };
    }
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
          <span className="label">Next 24h total</span>
          <span className="value">{totalFlightsNext24h}</span>
          <span className="meta">Scheduled within 24 hours</span>
        </div>
        <div className="summary-card highlight">
          <span className="label">Next 24h departures</span>
          <span className="value">{departuresNext24h}</span>
          <span className="meta">Outbound activity</span>
        </div>
        <div className="summary-card highlight">
          <span className="label">Next 24h arrivals</span>
          <span className="value">{arrivalsNext24h}</span>
          <span className="meta">Inbound activity</span>
        </div>
      </section>

      <section className="controls">
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
                placeholder="25"
                value={Number.isNaN(limit) ? "" : limit}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  setLimit(Number.isNaN(nextValue) ? 25 : nextValue);
                }}
              />
            </label>
            <button type="button" onClick={fetchData} disabled={isRefreshing}>
              Fetch now
            </button>
          </div>
        </div>
      </section>

      <section className="map-section">
        <div className="panel map-panel">
          <div className="panel-head">
            <h2>ORD live map</h2>
            <span className="pill">Hover or click the marker</span>
          </div>
          <div ref={mapRef} className="map-view" />
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-head">
            <h2>Latest 20 flights</h2>
            <span className="pill">{latestFlights.length} flights</span>
          </div>
          <div className="flight-list">
            {latestFlights.length === 0 ? (
              <p className="empty">No flights found.</p>
            ) : (
              latestFlights.map((flight, index) => (
                <article
                  key={`${flight.flight_number}-${flight.type}-${index}`}
                  className="flight-card"
                >
                  <div className="flight-head">
                    <div>
                      <strong>{flight.flight_number}</strong>
                      <span>{flight.airline}</span>
                    </div>
                    <span className="badge">
                      {flight.type} · {flight.status}
                    </span>
                  </div>
                  <div className="flight-body">
                    <span>
                      {flight.type === "Departure"
                        ? `To ${flight.destination}`
                        : `From ${flight.origin}`}
                    </span>
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
