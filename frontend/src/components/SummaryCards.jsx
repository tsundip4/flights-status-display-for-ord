export default function SummaryCards({
  totalFlightsNext24h,
  departuresNext24h,
  arrivalsNext24h,
}) {
  return (
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
  );
}
