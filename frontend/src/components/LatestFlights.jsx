import { formatDate, formatTime } from "../utils/formatters";

export default function LatestFlights({ flights }) {
  return (
    <section className="grid">
      <div className="panel">
        <div className="panel-head">
          <h2>Latest 20 flights</h2>
          <span className="pill">{flights.length} flights</span>
        </div>
        <div className="flight-list">
          {flights.length === 0 ? (
            <p className="empty">No flights found.</p>
          ) : (
            flights.map((flight, index) => (
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
  );
}
