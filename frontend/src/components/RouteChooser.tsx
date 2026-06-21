import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigationApi } from "../api/navigation";
import { apiErrorMessage } from "../lib/apiError";
import { loadGoogleMaps } from "../lib/googleMaps";
import type { NavigationRouteOption, NavigationRouteOptions } from "../types";

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
function optionLabel(option: NavigationRouteOption) {
  const toll = option.has_tolls ? "Tolls" : "No tolls";
  return `${formatDuration(option.duration_seconds)} - ${toll}`;
}
function optionDetail(option: NavigationRouteOption) {
  const km = `${(option.distance_meters / 1000).toFixed(0)} km`;
  return option.road_label ? `${km} - ${option.road_label}` : km;
}

// BlaBlaCar-style "What is your route?" screen. Shows the alternatives from
// Google Maps on the map; the driver picks one and saves.
export default function RouteChooser({
  originQuery,
  destinationQuery,
  originPosition,
  destinationPosition,
  onClose,
  onSave
}: {
  originQuery: string;
  destinationQuery: string;
  originPosition?: [number, number] | null;
  destinationPosition?: [number, number] | null;
  onClose: () => void;
  onSave: (option: NavigationRouteOption) => void;
}) {
  const [data, setData] = useState<NavigationRouteOptions | null>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linesRef = useRef<any[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    navigationApi
      .routeOptions(originQuery, destinationQuery, 2, originPosition, destinationPosition)
      .then((result) => {
        if (!active) return;
        if (!result.options.length) {
          setError("No routes found between these points.");
          return;
        }
        setData(result);
      })
      .catch((err) => active && setError(apiErrorMessage(err, "Could not load routes.")))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [originQuery, destinationQuery]);

  // Init the map once data arrives.
  useEffect(() => {
    if (!data || !mapContainer.current) return;
    let cancelled = false;
    (async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapContainer.current) return;
        const map = new google.maps.Map(mapContainer.current, {
          center: {
            lat: data.origin.position[1],
            lng: data.origin.position[0]
          },
          zoom: 7,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy"
        });
        mapRef.current = map;
        drawAll(google, map, linesRef, data, setSelected);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Map unavailable right now."));
      }
    })();
    return () => {
      cancelled = true;
      linesRef.current.forEach((l) => l.setMap?.(null));
      linesRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Restyle when the selection changes (selected route on top, dark).
  useEffect(() => {
    if (!data) return;
    linesRef.current.forEach((line, index) => {
      const isSel = index === selected;
      line.setOptions?.({
        strokeColor: isSel ? "#1b3a8b" : "#9cb3e0",
        strokeWeight: isSel ? 6 : 4,
        zIndex: isSel ? 10 : 1
      });
    });
  }, [selected, data]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="relative h-1/2 min-h-[240px]">
        <div ref={mapContainer} className="h-full w-full" />
        <button type="button" onClick={onClose} className="absolute left-3 top-3 rounded-full bg-white p-2 shadow" aria-label="Back">
          <ArrowLeft size={18} className="text-primary" />
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-auto p-5">
        <h2 className="text-xl font-bold">What is your route?</h2>
        {loading && <p className="mt-3 text-sm text-muted">Calculating routes…</p>}
        {error && <p className="alert-error mt-3">{error}</p>}
        {data && (
          <div className="mt-3 flex flex-col">
            {data.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelected(index)}
                className="flex items-center gap-3 border-b border-sand py-3 text-left"
              >
                <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${index === selected ? "border-primary" : "border-sand"}`}>
                  {index === selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span>
                  <span className="block font-bold">{optionLabel(option)}</span>
                  <span className="block text-sm text-muted">{optionDetail(option)}</span>
                </span>
              </button>
            ))}
            <div className="mt-5 flex justify-center">
              <button type="button" className="btn-primary px-10" onClick={() => onSave(data.options[selected])}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function drawAll(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  google: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linesRef: { current: any[] },
  data: NavigationRouteOptions,
  onSelect: (index: number) => void
) {
  const bounds = new google.maps.LatLngBounds();
  linesRef.current = [];

  data.options.forEach((option, index) => {
    const path = option.geometry
      .filter((p) => Array.isArray(p) && p.length >= 2)
      .map((p) => ({ lat: p[1], lng: p[0] }));
    if (path.length < 2) return;
    const isSel = index === 0;
    const line = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: isSel ? "#1b3a8b" : "#9cb3e0",
      strokeWeight: isSel ? 6 : 4,
      zIndex: isSel ? 10 : 1,
      map
    });
    line.addListener("click", () => onSelect(index));
    linesRef.current[index] = line;
    path.forEach((p: { lat: number; lng: number }) => bounds.extend(p));
  });

  new google.maps.Marker({
    position: { lat: data.origin.position[1], lng: data.origin.position[0] },
    map,
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#0f766e", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }
  });
  new google.maps.Marker({
    position: { lat: data.destination.position[1], lng: data.destination.position[0] },
    map,
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#b91c1c", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }
  });

  if (!bounds.isEmpty()) map.fitBounds(bounds, 50);
}
