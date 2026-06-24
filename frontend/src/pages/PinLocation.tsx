import { ArrowLeft, Crosshair, MapPin, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { navigationApi } from "../api/navigation";
import { apiErrorMessage } from "../lib/apiError";
import { loadGoogleMaps } from "../lib/googleMaps";

type Target = "source" | "destination";

// Full map page the driver is redirected to for pinning a pickup (source) or
// drop (destination) location. Search by name or drag the map under the fixed
// centre pin; the centre is reverse-geocoded live. Confirming returns the
// chosen city + [lng,lat] to the publish flow via router state.
export default function PinLocation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const target = (params.get("target") === "destination" ? "destination" : "source") as Target;
  const title = target === "source" ? "Pin pickup location" : "Pin drop location";

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pinLabel, setPinLabel] = useState("");
  const [pinPos, setPinPos] = useState<[number, number] | null>(null);
  const [pinCity, setPinCity] = useState("");

  // Initial centre passed from the publish flow: prior pin coords, else the
  // typed city. Map opens there so the driver only nudges the pin.
  const initLat = params.get("lat");
  const initLng = params.get("lng");
  const initQ = params.get("q") ?? "";

  const mapContainer = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // Skip the live reverse-geocode that an programmatic recenter would trigger.
  const skipIdle = useRef(false);
  // Idle reverse-geocoding stays muted until the initial centring is done, so
  // the default India view never sets a misleading pin.
  const initDone = useRef(false);

  // Debounced search autocomplete.
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
        if (active) {
          setItems(results.map((r) => r.label));
          setOpen(true);
        }
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

  // Build the map once on mount (centred on India until a place is chosen).
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let listener: any = null;
    (async () => {
      try {
        const google = await loadGoogleMaps();
        if (cancelled || !mapContainer.current) return;
        const map = new google.maps.Map(mapContainer.current, {
          center: { lat: 22.5937, lng: 78.9629 },
          zoom: 5,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false
        });
        mapRef.current = map;
        // Reverse-geocode the centre whenever the user stops panning.
        listener = map.addListener("idle", async () => {
          if (!initDone.current || skipIdle.current) {
            skipIdle.current = false;
            return;
          }
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

        // Centre on the prior pin or typed city, dropping the pin there. The
        // driver can still drag to refine afterwards.
        try {
          if (initLat && initLng) {
            const lat = Number(initLat);
            const lng = Number(initLng);
            map.setCenter({ lat, lng });
            map.setZoom(15);
            const place = await navigationApi.reverse(lat, lng);
            if (!cancelled) {
              setPinLabel(place.label);
              setPinPos([lng, lat]);
              setPinCity(place.city || "");
            }
          } else if (initQ) {
            const place = await navigationApi.geocode(initQ);
            const [plng, plat] = place.position;
            map.setCenter({ lat: plat, lng: plng });
            map.setZoom(13);
            if (!cancelled) {
              setPinLabel(place.label);
              setPinPos([plng, plat]);
              setPinCity(place.city || "");
            }
          }
        } catch {
          /* leave the default India view; the driver can search instead */
        } finally {
          initDone.current = true;
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Map unavailable right now."));
      }
    })();
    return () => {
      cancelled = true;
      listener?.remove?.();
      mapRef.current = null;
    };
  }, []);

  function recenter(position: [number, number], label: string, city: string) {
    setPinLabel(label);
    setPinPos(position);
    setPinCity(city);
    const map = mapRef.current;
    if (map) {
      skipIdle.current = true;
      map.setCenter({ lat: position[1], lng: position[0] });
      map.setZoom(15);
    }
  }

  async function chooseLabel(label: string) {
    setOpen(false);
    setItems([]);
    setQuery(label);
    setError("");
    setLoading(true);
    try {
      const place = await navigationApi.geocode(label);
      recenter([place.position[0], place.position[1]], place.label, place.city || "");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not locate that address."));
    } finally {
      setLoading(false);
    }
  }

  function useCurrentLocation() {
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
          recenter([place.position[0], place.position[1]], place.label, place.city || "");
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

  function cancel() {
    navigate("/driver/create-ride");
  }

  function confirm() {
    if (!pinLabel || !pinPos) return;
    const city = pinCity.trim() || pinLabel.split(",")[0].trim();
    navigate("/driver/create-ride", {
      state: { pin: { target, city, label: pinLabel, position: pinPos } }
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white">
      <div ref={mapContainer} className="absolute inset-0" aria-label="Pick location map" />

      {/* Top bar: back + search. */}
      <div className="relative z-10 flex flex-col gap-2 p-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={cancel} className="rounded-full bg-white p-2 shadow" aria-label="Back">
            <ArrowLeft size={18} className="text-primary" />
          </button>
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="w-full rounded-full border border-sand bg-white py-2 pl-9 pr-3 text-sm shadow outline-none"
              value={query}
              placeholder={title}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => items.length > 0 && setOpen(true)}
              autoComplete="off"
            />
            {open && (items.length > 0 || loading) && (
              <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-xl border border-sand bg-white shadow-lg">
                {loading && items.length === 0 && <li className="px-3 py-2 text-sm text-muted">Searching…</li>}
                {items.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseLabel(item)}
                      className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-sand-light"
                    >
                      <MapPin size={14} className="mt-0.5 shrink-0 text-muted" />
                      <span>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary shadow"
        >
          <Crosshair size={14} />
          Use current location
        </button>
        {error && <p className="alert-error">{error}</p>}
      </div>

      {/* Fixed centre pin. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full text-primary">
        <svg width="36" height="44" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" fill="#fff" />
        </svg>
      </div>

      {/* Bottom confirm sheet. */}
      <div className="relative z-10 mt-auto p-3">
        <div className="rounded-2xl bg-white p-4 shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
            {target === "source" ? "Pickup location" : "Drop location"}
          </p>
          <p className="mt-0.5 truncate text-sm font-bold">
            {pinLabel || "Drag the map or search to pick a spot"}
          </p>
          {pinCity && <p className="text-xs text-muted">City: {pinCity}</p>}
          <button type="button" className="btn-primary mt-3 w-full" disabled={!pinLabel || !pinPos} onClick={confirm}>
            Confirm {target === "source" ? "pickup" : "drop"}
          </button>
        </div>
      </div>
    </div>
  );
}
