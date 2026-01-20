import { useRef } from "react";
import ControlsSection from "./components/ControlsSection";
import DashboardHeader from "./components/DashboardHeader";
import ErrorBanner from "./components/ErrorBanner";
import LatestFlights from "./components/LatestFlights";
import MapSection from "./components/MapSection";
import SummaryCards from "./components/SummaryCards";
import { useArrivalsDeparturesChart } from "./hooks/useArrivalsDeparturesChart";
import { useFlightsData } from "./hooks/useFlightsData";
import { useFlightSummary } from "./hooks/useFlightSummary";
import { useOrdMap } from "./hooks/useOrdMap";

function ChicagoDashboard() {
  const chartRef = useRef(null);
  const mapRef = useRef(null);
  const {
    departures,
    arrivals,
    lastUpdated,
    error,
    isRefreshing,
    limit,
    setLimit,
    fetchData,
  } = useFlightsData();

  const {
    departuresNext24h,
    arrivalsNext24h,
    totalFlightsNext24h,
    summaryData,
    latestFlights,
  } = useFlightSummary(departures, arrivals);

  useArrivalsDeparturesChart(chartRef, summaryData);
  useOrdMap(mapRef, summaryData);

  return (
    <div className="dashboard">
      <DashboardHeader lastUpdated={lastUpdated} />
      <ErrorBanner error={error} />
      <SummaryCards
        totalFlightsNext24h={totalFlightsNext24h}
        departuresNext24h={departuresNext24h}
        arrivalsNext24h={arrivalsNext24h}
      />
      <ControlsSection
        chartRef={chartRef}
        isRefreshing={isRefreshing}
        onRefresh={fetchData}
        limit={limit}
        onLimitChange={setLimit}
        onFetch={fetchData}
      />
      <MapSection mapRef={mapRef} />
      <LatestFlights flights={latestFlights} />
    </div>
  );
}

export default ChicagoDashboard;
