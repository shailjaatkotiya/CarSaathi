import { MapPinned, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import { navigationApi } from "../api/navigation";
import { apiErrorMessage } from "../lib/apiError";
import type { NavigationRoute } from "../types";
import RouteMap from "./RouteMap";

function formatDistance(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) return "Distance unavailable";
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "Time unavailable";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export default function NavigationPanel({
  rideId,
  pickupPoint,
  dropPoint,
  disabledReason,
  variant = "full"
}: {
  rideId: string | number;
  pickupPoint: string;
  dropPoint: string;
  disabledReason?: string;
  // "full" = driver view with turn-by-turn directions + distance/time.
  // "line" = passenger view: just the selected route drawn on the map,
  // auto-loaded when both points are picked. No directions list.
  variant?: "full" | "line";
}) {
  const [route, setRoute] = useState<NavigationRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ready = Boolean(!disabledReason && pickupPoint && dropPoint);
  const disabled = !ready || loading;

  async function calculate() {
    if (!ready) return;
    setLoading(true);
    setError("");
    try {
      const data = await navigationApi.ride(rideId, pickupPoint, dropPoint);
      setRoute(data);
    } catch (err) {
      setRoute(null);
      setError(apiErrorMessage(err, "Could not load navigation right now."));
    } finally {
      setLoading(false);
    }
  }

  // Passenger line view auto-loads the route whenever the picked points change.
  useEffect(() => {
    if (variant !== "line") return;
    if (!ready) {
      setRoute(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    navigationApi
      .ride(rideId, pickupPoint, dropPoint)
      .then((data) => active && setRoute(data))
      .catch((err) => {
        if (!active) return;
        setRoute(null);
        setError(apiErrorMessage(err, "Could not load the route right now."));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, rideId, pickupPoint, dropPoint, ready]);

  // Passenger view: only the route line on the map, no directions.
  if (variant === "line") {
    return (
      <div className="rounded-xl border border-sand bg-cream p-3">
        <div className="flex items-center gap-2">
          <MapPinned size={16} className="text-primary" />
          <h3 className="text-sm font-bold">Your route</h3>
        </div>
        {disabledReason && <p className="mt-2 text-xs font-semibold text-muted">{disabledReason}</p>}
        {!disabledReason && (!pickupPoint || !dropPoint) && (
          <p className="mt-2 text-xs font-semibold text-muted">Select pickup and drop points to see your route.</p>
        )}
        {error && <p className="alert-error mt-2">{error}</p>}
        {loading && !route && <p className="mt-2 text-xs text-muted">Loading route…</p>}
        {route && (
          <div className="mt-3">
            <RouteMap route={route} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sand bg-cream p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPinned size={16} className="text-primary" />
            <h3 className="text-sm font-bold">Map navigation</h3>
          </div>
          <p className="mt-1 text-xs text-muted">
            Google Maps calculates the drive from pickup to selected drop.
          </p>
        </div>
        <button type="button" className="btn-outline min-h-0 px-3 py-1.5 text-xs" onClick={calculate} disabled={disabled}>
          <Navigation size={14} />
          {loading ? "Loading..." : "Get route"}
        </button>
      </div>

      {disabledReason && <p className="mt-2 text-xs font-semibold text-muted">{disabledReason}</p>}
      {!disabledReason && (!pickupPoint || !dropPoint) && (
        <p className="mt-2 text-xs font-semibold text-muted">Select pickup and drop points to view navigation.</p>
      )}
      {error && <p className="alert-error mt-2">{error}</p>}

      {route && (
        <div className="mt-3 space-y-3">
          <RouteMap route={route} />
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white p-2">
              <p className="text-[11px] font-bold text-muted">Drive distance</p>
              <p className="text-sm font-bold">{formatDistance(route.distance_meters)}</p>
            </div>
            <div className="rounded-lg bg-white p-2">
              <p className="text-[11px] font-bold text-muted">Estimated time</p>
              <p className="text-sm font-bold">{formatDuration(route.duration_seconds)}</p>
            </div>
          </div>
          <div className="rounded-lg bg-white p-2">
            <p className="text-[11px] font-bold text-muted">Resolved places</p>
            <p className="mt-1 text-xs leading-relaxed">
              {route.origin.label} to {route.destination.label}
            </p>
          </div>
          {route.steps.length > 0 && (
            <ol className="space-y-2">
              {route.steps.slice(0, 6).map((step, index) => (
                <li key={`${step.instruction}-${index}`} className="flex gap-2 text-xs">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{step.instruction}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
