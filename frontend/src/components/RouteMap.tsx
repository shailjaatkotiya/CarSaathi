import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { navigationApi } from "../api/navigation";
import { apiErrorMessage } from "../lib/apiError";
import type { NavigationRoute } from "../types";

// Renders the calculated route on an Amazon Location Maps API basemap.
// The map style + API key come from the backend /navigation/map-config
// endpoint; MapLibre appends the key to every maps.geo request.
export default function RouteMap({ route }: { route: NavigationRoute }) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState("");

  // Create the map once, on mount.
  useEffect(() => {
    let cancelled = false;
    let map: maplibregl.Map | null = null;

    (async () => {
      try {
        const cfg = await navigationApi.mapConfig();
        if (cancelled || !container.current) return;
        map = new maplibregl.Map({
          container: container.current,
          style: cfg.style_url,
          center: [78.9629, 22.5937],
          zoom: 4,
          attributionControl: { compact: true },
          transformRequest: (url) => {
            if (url.includes("maps.geo.") && !url.includes("key=")) {
              const sep = url.includes("?") ? "&" : "?";
              return { url: `${url}${sep}key=${encodeURIComponent(cfg.api_key)}` };
            }
            return { url };
          }
        });
        map.addControl(new maplibregl.NavigationControl(), "top-right");
        mapRef.current = map;
        map.on("load", () => drawRoute(map!, route));
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Map unavailable right now."));
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when the route changes (different pickup/drop).
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.isStyleLoaded()) drawRoute(map, route);
  }, [route]);

  if (error) {
    return <p className="alert-error mt-2">{error}</p>;
  }

  return (
    <div
      ref={container}
      className="h-56 w-full overflow-hidden rounded-lg border border-sand"
      aria-label="Route map"
    />
  );
}

function drawRoute(map: maplibregl.Map, route: NavigationRoute) {
  const coords = route.geometry.filter(
    (p) => Array.isArray(p) && p.length >= 2
  ) as [number, number][];

  // Reset any previous route layers/markers.
  if (map.getLayer("route-line")) map.removeLayer("route-line");
  if (map.getSource("route")) map.removeSource("route");
  (map as unknown as { _routeMarkers?: maplibregl.Marker[] })._routeMarkers?.forEach(
    (m) => m.remove()
  );

  const line = coords.length >= 2 ? coords : [route.origin.position, route.destination.position].filter(Boolean) as [number, number][];

  if (line.length >= 2) {
    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: line } }
    });
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#0f766e", "line-width": 4 }
    });
  }

  const markers: maplibregl.Marker[] = [];
  const origin = route.origin.position as [number, number];
  const dest = route.destination.position as [number, number];
  if (origin?.length >= 2) {
    markers.push(new maplibregl.Marker({ color: "#0f766e" }).setLngLat(origin).addTo(map));
  }
  if (dest?.length >= 2) {
    markers.push(new maplibregl.Marker({ color: "#b91c1c" }).setLngLat(dest).addTo(map));
  }
  (map as unknown as { _routeMarkers?: maplibregl.Marker[] })._routeMarkers = markers;

  const fitPts = line.length >= 2 ? line : [origin, dest].filter((p) => p?.length >= 2);
  if (fitPts.length >= 1) {
    const bounds = fitPts.reduce(
      (b, p) => b.extend(p as [number, number]),
      new maplibregl.LngLatBounds(fitPts[0] as [number, number], fitPts[0] as [number, number])
    );
    map.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 600 });
  }
}
