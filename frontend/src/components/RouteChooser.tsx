import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigationApi } from "../api/navigation";
import { apiErrorMessage } from "../lib/apiError";
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
// Amazon Location on the map; the driver picks one and saves.
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
  const mapRef = useRef<maplibregl.Map | null>(null);

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
    let map: maplibregl.Map | null = null;
    (async () => {
      try {
        const cfg = await navigationApi.mapConfig();
        if (cancelled || !mapContainer.current) return;
        map = new maplibregl.Map({
          container: mapContainer.current,
          style: cfg.style_url,
          center: data.origin.position as [number, number],
          zoom: 7,
          attributionControl: { compact: true },
          transformRequest: (url) => {
            if (url.includes("maps.geo.") && !url.includes("key=")) {
              const sep = url.includes("?") ? "&" : "?";
              return { url: `${url}${sep}key=${encodeURIComponent(cfg.api_key)}` };
            }
            return { url };
          }
        });
        mapRef.current = map;
        map.on("load", () => drawAll(map!, data));
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
  }, [data]);

  // Restyle when the selection changes (selected route on top, dark).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data || !map.isStyleLoaded()) return;
    data.options.forEach((_, index) => {
      if (!map.getLayer(`route-${index}`)) return;
      const isSel = index === selected;
      map.setPaintProperty(`route-${index}`, "line-color", isSel ? "#1b3a8b" : "#9cb3e0");
      map.setPaintProperty(`route-${index}`, "line-width", isSel ? 6 : 4);
      if (isSel) map.moveLayer(`route-${index}`);
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

function drawAll(map: maplibregl.Map, data: NavigationRouteOptions) {
  data.options.forEach((option, index) => {
    const coords = option.geometry.filter((p) => Array.isArray(p) && p.length >= 2);
    if (coords.length < 2) return;
    map.addSource(`route-${index}`, {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } }
    });
    map.addLayer({
      id: `route-${index}`,
      type: "line",
      source: `route-${index}`,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": index === 0 ? "#1b3a8b" : "#9cb3e0", "line-width": index === 0 ? 6 : 4 }
    });
  });
  // Selected (index 0) on top.
  if (map.getLayer("route-0")) map.moveLayer("route-0");

  new maplibregl.Marker({ color: "#0f766e" }).setLngLat(data.origin.position as [number, number]).addTo(map);
  new maplibregl.Marker({ color: "#b91c1c" }).setLngLat(data.destination.position as [number, number]).addTo(map);

  const all = data.options.flatMap((o) => o.geometry).filter((p) => p.length >= 2) as [number, number][];
  if (all.length >= 1) {
    const bounds = all.reduce(
      (b, p) => b.extend(p),
      new maplibregl.LngLatBounds(all[0], all[0])
    );
    map.fitBounds(bounds, { padding: 50, duration: 0 });
  }
}
