import { ArrowRight, Clock, Crosshair, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigationApi } from "../api/navigation";
import { apiErrorMessage } from "../lib/apiError";
import { loadGoogleMaps } from "../lib/googleMaps";

const RECENTS_KEY = "carthi_addr_recents";

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, 6) : [];
  } catch {
    return [];
  }
}
function saveRecent(label: string) {
  try {
    const next = [label, ...loadRecents().filter((item) => item !== label)].slice(0, 6);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

// BlaBlaCar-style full-screen address picker. Two views: a search list
// (autocomplete + current location + recents) and a map-pin confirm screen
// (drag the map under the fixed pin, reverse-geocoded live).
export default function AddressPicker({
  title,
  onClose,
  onConfirm,
  enableMap = true
}: {
  title: string;
  onClose: () => void;
  onConfirm: (label: string, position?: [number, number], city?: string) => void;
  enableMap?: boolean;
}) {
  const [view, setView] = useState<"search" | "map">("search");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [recents] = useState<string[]>(loadRecents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pinLabel, setPinLabel] = useState("");
  const [pinPos, setPinPos] = useState<[number, number] | null>(null);
  const [pinCity, setPinCity] = useState("");

  const mapContainer = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  // Debounced autocomplete.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const results = await navigationApi.search(q, 6);
        if (active) setItems(results.map((r) => r.label));
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(id);
    };
  }, [query]);

  function finish(label: string, position?: [number, number], city?: string) {
    saveRecent(label);
    onConfirm(label, position, city);
    onClose();
  }

  async function chooseLabel(label: string) {
    if (!enableMap) {
      finish(label);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const place = await navigationApi.geocode(label);
      setPinLabel(place.label);
      setPinPos([place.position[0], place.position[1]]);
      setPinCity(place.city || "");
      setView("map");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not locate that address."));
    } finally {
      setLoading(false);
    }
  }

  async function useCurrentLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError("Location is not available on this device.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const place = await navigationApi.reverse(latitude, longitude);
          if (!enableMap) {
            finish(place.label, [place.position[0], place.position[1]], place.city);
            return;
          }
          setPinLabel(place.label);
          setPinPos([place.position[0], place.position[1]]);
          setPinCity(place.city || "");
          setView("map");
        } catch (err) {
          setError(apiErrorMessage(err, "Could not read your current location."));
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location permission denied.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Build the confirm map when entering the map view.
  useEffect(() => {
    if (view !== "map" || !pinPos || !mapContainer.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let listener: any = null;
    (async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapContainer.current) return;
        const map = new google.maps.Map(mapContainer.current, {
          center: { lat: pinPos[1], lng: pinPos[0] },
          zoom: 15,
          disableDefaultUI: true,
          gestureHandling: "greedy",
          clickableIcons: false
        });
        mapRef.current = map;
        // Live reverse-geocode the map centre when the user stops moving.
        listener = map.addListener("idle", async () => {
          const c = map.getCenter();
          if (!c) return;
          try {
            const place = await navigationApi.reverse(c.lat(), c.lng());
            setPinLabel(place.label);
            setPinPos([c.lng(), c.lat()]);
            setPinCity(place.city || "");
          } catch {
            /* keep previous label */
          }
        });
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Map unavailable right now."));
      }
    })();
    return () => {
      cancelled = true;
      listener?.remove?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const showRecents = query.trim().length < 2;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {view === "search" ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-4 pt-4">
            <button type="button" onClick={onClose} aria-label="Close" className="text-primary">
              <X size={22} />
            </button>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <div className="px-4 pt-4">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                autoFocus
                className="input pl-9"
                value={query}
                placeholder="Enter the full address"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {error && <p className="alert-error mt-2">{error}</p>}
          </div>
          <div className="mt-2 flex-1 overflow-auto">
            <button
              type="button"
              onClick={useCurrentLocation}
              className="flex w-full items-center gap-3 border-b border-sand px-4 py-3 text-left"
            >
              <Crosshair size={18} className="text-primary" />
              <span className="font-bold text-primary">Use current location</span>
            </button>
            {loading && <p className="px-4 py-3 text-sm text-muted">Searching…</p>}
            {(showRecents ? recents : items).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => chooseLabel(label)}
                className="flex w-full items-start gap-3 border-b border-sand px-4 py-3 text-left"
              >
                <Clock size={16} className="mt-0.5 shrink-0 text-muted" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
            {!loading && !showRecents && items.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted">No matches. Keep typing…</p>
            )}
          </div>
        </div>
      ) : (
        <div className="relative h-full">
          <div ref={mapContainer} className="h-full w-full" />
          {/* Top search pill that reopens the list. */}
          <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3">
            <button type="button" onClick={() => setView("search")} className="rounded-full bg-white p-2 shadow" aria-label="Back to search">
              <Search size={16} className="text-primary" />
            </button>
            <div className="flex-1 truncate rounded-full bg-white px-4 py-2 text-sm font-semibold shadow">{pinLabel}</div>
          </div>
          {/* Fixed centre pin. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-primary">
            <svg width="32" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" fill="#fff" />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => pinLabel && finish(pinLabel, pinPos ?? undefined, pinCity)}
            disabled={!pinLabel}
            className="btn-primary absolute bottom-6 right-6 h-12 w-12 rounded-full p-0"
            aria-label="Confirm location"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
