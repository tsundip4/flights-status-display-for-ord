import { useEffect, useRef } from "react";
import { ORD_COORDS } from "../constants/flightConstants";

export function useOrdMap(mapRef, summaryData) {
  const mapViewRef = useRef(null);
  const ordGraphicRef = useRef(null);

  useEffect(() => {
    let view;

    const initMap = async () => {
      if (!mapRef.current || mapViewRef.current) return;
      const [
        { default: ArcGISMap },
        { default: MapView },
        { default: Graphic },
        { default: esriConfig },
      ] = await Promise.all([
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
  }, [mapRef, summaryData]);

  useEffect(() => {
    if (ordGraphicRef.current) {
      ordGraphicRef.current.attributes = {
        departures: summaryData[0].value,
        arrivals: summaryData[1].value,
      };
    }
  }, [summaryData]);
}
