import { ChevronRight, MapPin, Navigation, Plus, Route as RouteIcon, X } from "lucide-react";
import { useState } from "react";
import type { NavigationRouteOption } from "../types";
import AddressPicker from "./AddressPicker";
import RouteChooser from "./RouteChooser";

function parseList(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
function serializeList(items: string[]): string {
  return items.join(", ");
}
function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours <= 0) return `${rest} min`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

// A tappable row that opens the BlaBlaCar address picker.
function AddressRow({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-sand bg-white p-3 text-left">
      <MapPin size={18} className="shrink-0 text-primary" />
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <span className={`block truncate text-sm ${value ? "font-semibold text-ink" : "text-muted"}`}>
          {value || "Enter the full address"}
        </span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-muted" />
    </button>
  );
}

// A chip list with an "add" button that opens the address picker (no map).
function ChipList({
  label,
  hint,
  value,
  onChange,
  onAdd
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
}) {
  const items = parseList(value);
  function remove(target: string) {
    onChange(serializeList(items.filter((item) => item !== target)));
  }
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="field-label">
          {label} ({items.length})
        </span>
        <button type="button" className="btn-outline min-h-0 px-3 py-1 text-xs" onClick={onAdd}>
          <Plus size={14} />
          Add
        </button>
      </div>
      <span className="field-hint">{hint}</span>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item} className="chip flex items-center gap-1">
              {item}
              <button type="button" onClick={() => remove(item)} aria-label={`Remove ${item}`}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

type Picker =
  | null
  | { kind: "pickup" }
  | { kind: "drop" }
  | { kind: "addPickup" }
  | { kind: "addStop" }
  | { kind: "addDrop" };

export default function TripRoutePlanner({
  sourceCity,
  setSourceCity,
  destinationCity,
  setDestinationCity,
  pickupPoints,
  setPickupPoints,
  routeStops,
  setRouteStops,
  dropPoints,
  setDropPoints,
  setDistanceKm,
  setSourceCoords,
  setDestinationCoords
}: {
  sourceCity: string;
  setSourceCity: (value: string) => void;
  destinationCity: string;
  setDestinationCity: (value: string) => void;
  pickupPoints: string;
  setPickupPoints: (value: string) => void;
  routeStops: string;
  setRouteStops: (value: string) => void;
  dropPoints: string;
  setDropPoints: (value: string) => void;
  setDistanceKm: (value: string) => void;
  setSourceCoords?: (pos: [number, number] | null) => void;
  setDestinationCoords?: (pos: [number, number] | null) => void;
}) {
  const [picker, setPicker] = useState<Picker>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [chosen, setChosen] = useState<NavigationRouteOption | null>(null);
  // Coordinates from the address picker, used to route without re-geocoding a
  // vague POI label. Null until the driver picks via the map.
  const [sourcePos, setSourcePos] = useState<[number, number] | null>(null);
  const [destPos, setDestPos] = useState<[number, number] | null>(null);

  function appendTo(value: string, setValue: (v: string) => void, label: string) {
    const items = parseList(value);
    if (items.some((item) => item.toLowerCase() === label.toLowerCase())) return;
    setValue(serializeList([...items, label]));
  }

  function handleConfirm(label: string, position?: [number, number], city?: string) {
    if (!picker) return;
    switch (picker.kind) {
      case "pickup":
        // Show only the city; keep the precise geo behind it.
        setSourceCity(city?.trim() || label);
        setSourcePos(position ?? null);
        setSourceCoords?.(position ?? null);
        setChosen(null);
        break;
      case "drop":
        setDestinationCity(city?.trim() || label);
        setDestPos(position ?? null);
        setDestinationCoords?.(position ?? null);
        setChosen(null);
        break;
      case "addPickup":
        appendTo(pickupPoints, setPickupPoints, label);
        break;
      case "addStop":
        appendTo(routeStops, setRouteStops, label);
        break;
      case "addDrop":
        appendTo(dropPoints, setDropPoints, label);
        break;
    }
  }

  function handleSaveRoute(option: NavigationRouteOption) {
    setChosen(option);
    const km = option.distance_meters / 1000;
    if (km > 0) setDistanceKm(km.toFixed(1));
    setShowRoute(false);
  }

  const canRoute = Boolean(sourceCity.trim() && destinationCity.trim());
  const pickerTitle: Record<string, string> = {
    pickup: "Pick-up",
    drop: "Drop-off",
    addPickup: "Add a pickup point",
    addStop: "Add an in-between stop",
    addDrop: "Add a drop point"
  };
  const pickerMapEnabled = picker?.kind === "pickup" || picker?.kind === "drop";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <AddressRow label="Pick-up" value={sourceCity} onClick={() => setPicker({ kind: "pickup" })} />
        <AddressRow label="Drop-off" value={destinationCity} onClick={() => setPicker({ kind: "drop" })} />
      </div>

      <div className="rounded-xl border border-sand bg-cream p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RouteIcon size={16} className="text-primary" />
            <h3 className="text-sm font-bold">Your route</h3>
          </div>
          <button type="button" className="btn-primary min-h-0 px-3 py-1.5 text-xs" onClick={() => setShowRoute(true)} disabled={!canRoute}>
            <Navigation size={14} />
            {chosen ? "Change route" : "Select route"}
          </button>
        </div>
        {chosen ? (
          <div className="mt-2 rounded-lg bg-white p-2 text-sm">
            <p className="font-bold">
              {(chosen.distance_meters / 1000).toFixed(0)} km · {formatDuration(chosen.duration_seconds)}
            </p>
            <p className="text-xs text-muted">
              {chosen.has_tolls ? "Tolls" : "No tolls"}
              {chosen.road_label ? ` · ${chosen.road_label}` : ""}
            </p>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted">
            {canRoute ? "Pick a route on the map to set the distance." : "Set pick-up and drop-off first."}
          </p>
        )}
      </div>

      <ChipList
        label="Pickup points - minimum 1"
        hint="Add pickup spots in the source city."
        value={pickupPoints}
        onChange={setPickupPoints}
        onAdd={() => setPicker({ kind: "addPickup" })}
      />
      <ChipList
        label="In-between stops"
        hint="Optional stops passengers can choose before the final drop."
        value={routeStops}
        onChange={setRouteStops}
        onAdd={() => setPicker({ kind: "addStop" })}
      />
      <ChipList
        label="Drop points - minimum 1"
        hint="Final-city drop points passengers can choose."
        value={dropPoints}
        onChange={setDropPoints}
        onAdd={() => setPicker({ kind: "addDrop" })}
      />

      {picker && (
        <AddressPicker
          title={pickerTitle[picker.kind]}
          enableMap={pickerMapEnabled}
          onClose={() => setPicker(null)}
          onConfirm={handleConfirm}
        />
      )}
      {showRoute && canRoute && (
        <RouteChooser
          originQuery={sourceCity}
          destinationQuery={destinationCity}
          originPosition={sourcePos}
          destinationPosition={destPos}
          onClose={() => setShowRoute(false)}
          onSave={handleSaveRoute}
        />
      )}
    </div>
  );
}
