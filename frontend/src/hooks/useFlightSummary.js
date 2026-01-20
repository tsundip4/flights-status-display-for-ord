import { useMemo } from "react";

export function useFlightSummary(departures, arrivals) {
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

  return {
    departuresNext24h,
    arrivalsNext24h,
    totalFlightsNext24h,
    summaryData,
    latestFlights,
  };
}
