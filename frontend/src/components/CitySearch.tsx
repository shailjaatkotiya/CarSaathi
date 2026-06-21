import { MapPin, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigationApi } from "../api/navigation";

export type ResolvedCity = {
  city: string;
  label: string;
  position: [number, number] | null;
};

// A location autocomplete that resolves what the user types to a CITY.
// Suggestions come from Google Places (via the backend); picking one geocodes
// it and reports the city name (plus coords) through onResolved. Free text is
// still propagated via onChange so a manually typed city keeps working.
export default function CitySearch({
  label,
  value,
  onChange,
  onResolved,
  placeholder,
  icon: Icon = MapPin,
  wrapperClassName = "flex flex-col gap-1 rounded-xl px-3 py-2",
  labelClassName = "text-[11px] font-bold uppercase tracking-wide text-muted",
  inputClassName = "w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted"
}: {
  label: string;
  value: string;
  onChange: (city: string) => void;
  onResolved?: (info: ResolvedCity) => void;
  placeholder?: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
}) {
  const [items, setItems] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // Skip the search that would fire right after we set the input to a picked city.
  const skipNext = useRef(false);

  // Debounced autocomplete.
  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const q = value.trim();
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
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function pick(suggestion: string) {
    setOpen(false);
    setItems([]);
    try {
      const place = await navigationApi.geocode(suggestion);
      const city = place.city?.trim() || suggestion.split(",")[0].trim();
      skipNext.current = true;
      onChange(city);
      onResolved?.({
        city,
        label: place.label,
        position: place.position?.length >= 2 ? [place.position[0], place.position[1]] : null
      });
    } catch {
      // Fall back to the first part of the suggestion as the city.
      const city = suggestion.split(",")[0].trim();
      skipNext.current = true;
      onChange(city);
      onResolved?.({ city, label: suggestion, position: null });
    }
  }

  return (
    <div ref={boxRef} className={`relative ${wrapperClassName}`}>
      <span className={labelClassName}>{label}</span>
      <span className="flex items-center gap-2">
        <Icon size={16} className="shrink-0 text-muted" />
        <input
          className={inputClassName}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </span>
      {open && (items.length > 0 || loading) && (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-auto rounded-xl border border-sand bg-white shadow-lg">
          {loading && items.length === 0 && <li className="px-3 py-2 text-sm text-muted">Searching…</li>}
          {items.map((item) => (
            <li key={item}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(item)}
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
  );
}
