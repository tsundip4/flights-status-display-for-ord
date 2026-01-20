import { useEffect, useRef, useState } from "react";
import { AIRPORT, API_BASE, POLL_INTERVAL_MS } from "../constants/flightConstants";
import { fetchFlights } from "../services/flightsService";

export function useFlightsData() {
  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [limit, setLimit] = useState(25);
  const initialLimitRef = useRef(limit);

  const fetchData = async (requestedLimit) => {
    setIsRefreshing(true);
    try {
      const resolvedLimit =
        typeof requestedLimit === "number" && !Number.isNaN(requestedLimit)
          ? requestedLimit
          : limit;
      const payload = await fetchFlights({
        baseUrl: API_BASE,
        airport: AIRPORT,
        limit: resolvedLimit,
      });
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
    fetchData(initialLimitRef.current);
    const timer = setInterval(
      () => fetchData(initialLimitRef.current),
      POLL_INTERVAL_MS
    );
    return () => clearInterval(timer);
  }, []);

  return {
    departures,
    arrivals,
    lastUpdated,
    error,
    isRefreshing,
    limit,
    setLimit,
    fetchData,
  };
}
