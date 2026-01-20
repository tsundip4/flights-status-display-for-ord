export default function MapSection({ mapRef }) {
  return (
    <section className="map-section">
      <div className="panel map-panel">
        <div className="panel-head">
          <h2>ORD live map</h2>
          <span className="pill">Hover or click the marker</span>
        </div>
        <div ref={mapRef} className="map-view" />
      </div>
    </section>
  );
}
