import { useEffect } from "react";
import { renderArrivalsDeparturesChart } from "../d3/arrivalsDeparturesChart";

export function useArrivalsDeparturesChart(chartRef, summaryData) {
  useEffect(() => {
    if (!chartRef.current) return;
    renderArrivalsDeparturesChart(chartRef.current, summaryData);
  }, [chartRef, summaryData]);
}
