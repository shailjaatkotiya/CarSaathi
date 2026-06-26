import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, type LucideIcon } from "lucide-react";
import { GUJARAT_CITIES } from "../constants/cities";

const MAX_SUGGESTIONS = 6;

// City text input with a keyboard-navigable suggestion list. On focus the field
// gently zooms; Arrow keys move the highlight, Enter autofills, Esc closes.
export default function CityAutocomplete({
  value,
  onChange,
  placeholder,
  icon: Icon,
  label,
  containerClassName,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  label?: string;
  containerClassName?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [];
    return GUJARAT_CITIES.filter(
      (city) => city.toLowerCase().includes(query) && city.toLowerCase() !== query,
    ).slice(0, MAX_SUGGESTIONS);
  }, [value]);

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  useEffect(() => {
    function onDocMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function pick(city: string) {
    onChange(city);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      if (open && suggestions[highlight]) {
        event.preventDefault();
        pick(suggestions[highlight]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && focused && suggestions.length > 0;

  return (
    <div ref={containerRef} className={`relative ${containerClassName ?? ""}`} style={{display:'flex'}}>
      <label
        className={`block origin-center transition-transform duration-150 ${
          focused ? "scale-[1.03]" : ""
        } ${className ?? ""}`}
      >
        {label && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
            {label}
          </span>
        )}
        <span className="flex items-center gap-2">
          {Icon && <Icon size={16} className="shrink-0 text-neutral-400" />}
          <input
            className={inputClassName}
            value={value}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={showList}
            aria-autocomplete="list"
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setOpen(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
          />
        </span>
      </label>
      {showList && (
        <ul className="absolute left-0 z-30 mt-1 max-h-64 w-full min-w-[200px] overflow-auto rounded-xl border border-sand bg-white py-1 shadow-xl">
          {suggestions.map((city, index) => (
            <li key={city}>
              <button
                type="button"
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  index === highlight
                    ? "bg-sand-light font-bold text-ink"
                    : "text-muted hover:bg-sand-light"
                }`}
                // mousedown (not click) so we pick before the input blurs.
                onMouseDown={(event) => {
                  event.preventDefault();
                  pick(city);
                }}
                onMouseEnter={() => setHighlight(index)}
              >
                <MapPin size={14} className="shrink-0 text-primary" />
                {city}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
