import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../lib/apiError";
import { loadGoogleMaps } from "../lib/googleMaps";
import type { NavigationRoute } from "../types";

// Renders the calculated route on a Google Maps basemap. The Maps JavaScript
// API key comes from the backend /navigation/map-config endpoint.
export default function RouteMap({ route }: { route: NavigationRoute }) {
  const container = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const [error, setError] = useState("");

  // Create the map once, on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !container.current) return;
        const map = new google.maps.Map(container.current, {
          center: { lat: 22.5937, lng: 78.9629 },
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy"
        });
        mapRef.current = map;
        drawRoute(google, map, overlaysRef, route);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Map unavailable right now."));
      }
    })();
    return () => {
      cancelled = true;
      overlaysRef.current.forEach((o) => o.setMap?.(null));
      overlaysRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw when the route changes (different pickup/drop).
  useEffect(() => {
    const map = mapRef.current;
    if (map && window.google?.maps) drawRoute(window.google, map, overlaysRef, route);
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

function drawRoute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overlaysRef: { current: any[] },
  route: NavigationRoute
) {
  overlaysRef.current.forEach((o) => o.setMap?.(null));
  overlaysRef.current = [];

  const coords = route.geometry
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map((p) => ({ lat: p[1], lng: p[0] }));
  const origin = route.origin.position;
  const dest = route.destination.position;
  const path =
    coords.length >= 2
      ? coords
      : [origin, dest]
          .filter((p) => Array.isArray(p) && p.length >= 2)
          .map((p) => ({ lat: p[1], lng: p[0] }));

  const bounds = new google.maps.LatLngBounds();

  if (path.length >= 2) {
    const line = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#0f766e",
      strokeWeight: 4,
      map
    });
    overlaysRef.current.push(line);
    path.forEach((p: { lat: number; lng: number }) => bounds.extend(p));
  }

  if (origin?.length >= 2) {
    const m = new google.maps.Marker({
      position: { lat: origin[1], lng: origin[0] },
      map,
      icon: pinIcon(google, "#0f766e")
    });
    overlaysRef.current.push(m);
    bounds.extend({ lat: origin[1], lng: origin[0] });
  }
  if (dest?.length >= 2) {
    const m = new google.maps.Marker({
      position: { lat: dest[1], lng: dest[0] },
      map,
      icon: pinIcon(google, "#b91c1c")
    });
    overlaysRef.current.push(m);
    bounds.extend({ lat: dest[1], lng: dest[0] });
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, 40);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pinIcon(google: any, color: string) {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 7,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2
  };
}
