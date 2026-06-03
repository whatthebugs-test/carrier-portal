"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

export function ShipmentMap({ token, lat, lng }: { token: string; lat: number; lng: number }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("mapbox-gl").Map | undefined;
    let cancelled = false;

    void import("mapbox-gl").then(({ default: mapboxgl }) => {
      if (cancelled || !container.current) return;
      mapboxgl.accessToken = token;
      map = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [lng, lat],
        zoom: 6,
        attributionControl: false,
      });
      new mapboxgl.Marker({ color: "#dc6624" }).setLngLat([lng, lat]).addTo(map);
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [token, lat, lng]);

  return <div ref={container} className="h-64 overflow-hidden rounded-lg border border-slate-200" aria-label="Last known location" />;
}
