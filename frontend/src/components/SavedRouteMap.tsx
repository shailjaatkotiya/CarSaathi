import { useEffect, useRef, useState } from "react";
import { apiErrorMessage } from "../lib/apiError";
import { loadGoogleMaps } from "../lib/googleMaps";
import type { SavedRoute } from "../types";

// Replays the driver-selected route (saved on the ride) on a Google Maps
// basemap for passengers. Pure render — no Google calls beyond loading the
// JS API; the polyline comes straight from the persisted geometry.
export default function SavedRouteMap({ route }: { route: SavedRoute }) {
  const container = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const overlaysRef = useRef<any[]>([]);
  const [error, setError] = useState("");

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
  }, [route]);

  if (error) {
    return <p className="alert-error mt-2">{error}</p>;
  }

  return (
    <div
      ref={container}
      className="h-56 w-full overflow-hidden rounded-lg border border-sand"
      aria-label="Saved route map"
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
  route: SavedRoute
) {
  overlaysRef.current.forEach((o) => o.setMap?.(null));
  overlaysRef.current = [];

  const origin = route.origin_position ?? undefined;
  const dest = route.destination_position ?? undefined;
  const coords = (route.geometry ?? [])
    .filter((p) => Array.isArray(p) && p.length >= 2)
    .map((p) => ({ lat: p[1], lng: p[0] }));
  const path =
    coords.length >= 2
      ? coords
      : [origin, dest]
          .filter((p): p is number[] => Array.isArray(p) && p.length >= 2)
          .map((p) => ({ lat: p[1], lng: p[0] }));

  const bounds = new google.maps.LatLngBounds();

  if (path.length >= 2) {
    const line = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: "#546B41",
      strokeWeight: 5,
      map
    });
    overlaysRef.current.push(line);
    path.forEach((p: { lat: number; lng: number }) => bounds.extend(p));
  }

  if (origin && origin.length >= 2) {
    const m = new google.maps.Marker({
      position: { lat: origin[1], lng: origin[0] },
      map,
      icon: pinIcon(google, "#0f766e")
    });
    overlaysRef.current.push(m);
    bounds.extend({ lat: origin[1], lng: origin[0] });
  }
  if (dest && dest.length >= 2) {
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
