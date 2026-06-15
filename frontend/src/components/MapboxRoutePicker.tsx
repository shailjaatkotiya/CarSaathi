import "mapbox-gl/dist/mapbox-gl.css";

import { ArrowRight, LocateFixed, MapPin, Search, X } from "lucide-react";
import mapboxgl, { LngLatBounds, type GeoJSONSource, type Map as MapboxMap, type Marker } from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";

type Point = {
  label: string;
  city: string;
  coordinates: [number, number];
};

type Suggestion = Point & {
  id: string;
};

type RouteChoice = {
  distanceKm: number;
  durationMinutes: number;
  summary: string;
  geometry: GeoJSON.LineString;
};

export type SelectedRoute = {
  pickup: Point;
  drop: Point;
  route: RouteChoice;
};

type Props = {
  sourceCity: string;
  destinationCity: string;
  pickupLabel: string;
  dropLabel: string;
  onPickupLabelChange: (value: string) => void;
  onDropLabelChange: (value: string) => void;
  onApply: (selection: SelectedRoute) => void;
};

const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const gujaratCenter: [number, number] = [71.1924, 22.2587];

function cityFromFeature(feature: any): string {
  const context = feature.context ?? [];
  const contextCity =
    context.find((item: any) => item.id?.startsWith("place."))?.text ||
    context.find((item: any) => item.id?.startsWith("locality."))?.text ||
    context.find((item: any) => item.id?.startsWith("district."))?.text;
  return contextCity || feature.text || feature.place_name?.split(",")[0]?.trim() || "";
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function styleForRoute(index: number, selected: boolean): mapboxgl.LinePaint {
  return {
    "line-color": selected ? "#0B84FF" : "#7AA7C7",
    "line-width": selected ? 6 : 3,
    "line-opacity": selected ? 0.95 : 0.55
  };
}

async function searchPlaces(query: string, proximity?: [number, number]): Promise<Suggestion[]> {
  if (!mapboxToken || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    access_token: mapboxToken,
    autocomplete: "true",
    country: "IN",
    language: "en",
    limit: "5",
    types: "address,poi,place,locality,neighborhood"
  });
  if (proximity) params.set("proximity", proximity.join(","));
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.features ?? []).map((feature: any) => ({
    id: feature.id,
    label: feature.place_name,
    city: cityFromFeature(feature),
    coordinates: feature.center
  }));
}

async function fetchRoutes(pickup: Point, drop: Point): Promise<RouteChoice[]> {
  if (!mapboxToken) return [];
  const coordinates = `${pickup.coordinates.join(",")};${drop.coordinates.join(",")}`;
  const params = new URLSearchParams({
    access_token: mapboxToken,
    alternatives: "true",
    geometries: "geojson",
    overview: "full",
    steps: "false"
  });
  const response = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.routes ?? []).map((route: any, index: number) => ({
    distanceKm: Math.round((route.distance / 1000) * 10) / 10,
    durationMinutes: Math.round(route.duration / 60),
    summary: route.legs?.[0]?.summary || `Route ${index + 1}`,
    geometry: route.geometry
  }));
}

function routeLabel(route: RouteChoice, index: number) {
  const name = index === 0 ? "Suggested route" : `Alternative ${index + 1}`;
  return route.summary ? `${name} - ${route.summary}` : name;
}

function LocationSearch({
  label,
  value,
  placeholder,
  suggestions,
  onChange,
  onSelect,
  onClear
}: {
  label: string;
  value: string;
  placeholder: string;
  suggestions: Suggestion[];
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-sand bg-primary-soft px-3 py-2">
        <Search size={16} className="shrink-0 text-muted" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-muted"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        {value && (
          <button type="button" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-sand" onClick={onClear} aria-label={`Clear ${label}`}>
            <X size={15} />
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-sand bg-white p-1 shadow-card">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-sand-light"
              onClick={() => onSelect(suggestion)}
            >
              <MapPin size={15} className="mt-0.5 shrink-0 text-primary" />
              <span>
                <span className="block font-bold text-ink">{suggestion.label.split(",")[0]}</span>
                <span className="block text-xs text-muted">{suggestion.label}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapboxRoutePicker({
  sourceCity,
  destinationCity,
  pickupLabel,
  dropLabel,
  onPickupLabelChange,
  onDropLabelChange,
  onApply
}: Props) {
  const mapRef = useRef<MapboxMap | null>(null);
  const pickupMarkerRef = useRef<Marker | null>(null);
  const dropMarkerRef = useRef<Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [pickup, setPickup] = useState<Point | null>(null);
  const [drop, setDrop] = useState<Point | null>(null);
  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<Suggestion[]>([]);
  const [routes, setRoutes] = useState<RouteChoice[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [message, setMessage] = useState("");

  const hasToken = Boolean(mapboxToken);
  const selectedRoute = routes[selectedRouteIndex];
  const pickupQuery = useMemo(() => pickupLabel || sourceCity, [pickupLabel, sourceCity]);
  const dropQuery = useMemo(() => dropLabel || destinationCity, [dropLabel, destinationCity]);

  useEffect(() => {
    if (!hasToken) return;
    const timer = window.setTimeout(async () => {
      setPickupSuggestions(await searchPlaces(pickupQuery));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [hasToken, pickupQuery]);

  useEffect(() => {
    if (!hasToken) return;
    const timer = window.setTimeout(async () => {
      setDropSuggestions(await searchPlaces(dropQuery, pickup?.coordinates));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [dropQuery, hasToken, pickup]);

  useEffect(() => {
    if (!hasToken || !mapContainerRef.current || mapRef.current) return;
    mapboxgl.accessToken = mapboxToken;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: gujaratCenter,
      zoom: 6,
      style: "mapbox://styles/mapbox/streets-v12"
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    return () => {
      pickupMarkerRef.current?.remove();
      dropMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasToken]);

  useEffect(() => {
    async function updateRoutes() {
      if (!pickup || !drop) {
        setRoutes([]);
        return;
      }
      setIsLoadingRoutes(true);
      setMessage("");
      const choices = await fetchRoutes(pickup, drop);
      setRoutes(choices);
      setSelectedRouteIndex(0);
      setIsLoadingRoutes(false);
      if (!choices.length) setMessage("No driving route found for those points. Try nearby city or highway points.");
    }
    updateRoutes();
  }, [pickup, drop]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const activeMap: MapboxMap = map;

    function draw() {
      pickupMarkerRef.current?.remove();
      dropMarkerRef.current?.remove();

      if (pickup) {
        pickupMarkerRef.current = new mapboxgl.Marker({ color: "#0B84FF" }).setLngLat(pickup.coordinates).addTo(activeMap);
      }
      if (drop) {
        dropMarkerRef.current = new mapboxgl.Marker({ color: "#111827" }).setLngLat(drop.coordinates).addTo(activeMap);
      }

      routes.forEach((route, index) => {
        const id = `route-${index}`;
        const source = activeMap.getSource(id) as GeoJSONSource | undefined;
        const data: GeoJSON.Feature<GeoJSON.LineString> = {
          type: "Feature",
          properties: {},
          geometry: route.geometry
        };
        if (source) {
          source.setData(data);
        } else {
          activeMap.addSource(id, { type: "geojson", data });
          activeMap.addLayer({
            id,
            type: "line",
            source: id,
            layout: { "line-cap": "round", "line-join": "round" },
            paint: styleForRoute(index, index === selectedRouteIndex)
          });
        }
        activeMap.setPaintProperty(id, "line-color", index === selectedRouteIndex ? "#0B84FF" : "#7AA7C7");
        activeMap.setPaintProperty(id, "line-width", index === selectedRouteIndex ? 6 : 3);
        activeMap.setPaintProperty(id, "line-opacity", index === selectedRouteIndex ? 0.95 : 0.55);
      });

      Array.from({ length: 4 }).forEach((_, index) => {
        if (!routes[index] && activeMap.getLayer(`route-${index}`)) {
          activeMap.removeLayer(`route-${index}`);
          activeMap.removeSource(`route-${index}`);
        }
      });

      if (pickup && drop) {
        const bounds = new LngLatBounds(pickup.coordinates, pickup.coordinates);
        bounds.extend(drop.coordinates);
        routes.forEach((route) => route.geometry.coordinates.forEach((coordinate) => bounds.extend(coordinate as [number, number])));
        activeMap.fitBounds(bounds, { padding: 44, maxZoom: 11 });
      } else if (pickup || drop) {
        activeMap.flyTo({ center: (pickup || drop)!.coordinates, zoom: 11 });
      }
    }

    if (activeMap.loaded()) {
      draw();
    } else {
      activeMap.once("load", draw);
    }
  }, [drop, pickup, routes, selectedRouteIndex]);

  function selectPickup(suggestion: Suggestion) {
    setPickup(suggestion);
    onPickupLabelChange(suggestion.label);
    setPickupSuggestions([]);
  }

  function selectDrop(suggestion: Suggestion) {
    setDrop(suggestion);
    onDropLabelChange(suggestion.label);
    setDropSuggestions([]);
  }

  function applyRoute() {
    if (!pickup || !drop || !selectedRoute) {
      setMessage("Choose pickup, drop, and route before applying.");
      return;
    }
    onApply({ pickup, drop, route: selectedRoute });
    setMessage("Route applied to your ride details.");
  }

  if (!hasToken) {
    return (
      <div className="rounded-2xl border border-sand bg-sand-light p-4">
        <p className="font-bold">Mapbox token needed</p>
        <p className="mt-1 text-sm text-muted">
          Add `VITE_MAPBOX_ACCESS_TOKEN` in `frontend/.env` to enable map search, pins, and route alternatives. You can keep using the manual route fields meanwhile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <LocationSearch
          label="Pick-up"
          value={pickupLabel}
          placeholder="Enter the full pickup address"
          suggestions={pickupSuggestions}
          onChange={onPickupLabelChange}
          onSelect={selectPickup}
          onClear={() => {
            setPickup(null);
            onPickupLabelChange("");
          }}
        />
        <LocationSearch
          label="Drop"
          value={dropLabel}
          placeholder="Enter the full drop address"
          suggestions={dropSuggestions}
          onChange={onDropLabelChange}
          onSelect={selectDrop}
          onClear={() => {
            setDrop(null);
            onDropLabelChange("");
          }}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-sand bg-sand-light">
        <div ref={mapContainerRef} className="h-[360px] w-full" />
      </div>

      <div className="rounded-2xl border border-sand bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">What is your route?</h3>
            <p className="text-sm text-muted">Pick one route, then apply it to the ride.</p>
          </div>
          <button type="button" className="btn-primary shrink-0 px-4" onClick={applyRoute} disabled={!selectedRoute}>
            Apply
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {isLoadingRoutes && <p className="alert-info">Finding route options...</p>}
          {!isLoadingRoutes &&
            routes.map((route, index) => (
              <button
                key={`${route.summary}-${route.distanceKm}-${index}`}
                type="button"
                className="flex items-start gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-sand-light"
                onClick={() => setSelectedRouteIndex(index)}
              >
                <span
                  className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                    selectedRouteIndex === index ? "border-primary" : "border-sand"
                  }`}
                >
                  {selectedRouteIndex === index && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span>
                  <span className="block font-bold text-ink">{formatDuration(route.durationMinutes)}</span>
                  <span className="block text-sm text-muted">
                    {route.distanceKm} km - {routeLabel(route, index)}
                  </span>
                </span>
              </button>
            ))}
          {message && <p className={message.includes("applied") ? "alert-success" : "alert-warning"}>{message}</p>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <LocateFixed size={13} />
            Main pickup and drop become the first points passengers see.
          </span>
        </div>
      </div>
    </div>
  );
}
