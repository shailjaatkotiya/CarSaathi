import { Calendar } from "lucide-react";
import { useRef } from "react";

export function getTodayInputDate() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function getMaxTravelDate() {
  const now = new Date();
  now.setDate(now.getDate() + 10);
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function clampTravelDate(value?: string | null) {
  const today = getTodayInputDate();
  const maxDate = getMaxTravelDate();
  if (!value || value < today) return today;
  if (value > maxDate) return maxDate;
  return value;
}

function formatTravelDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function TravelDatePicker({
  value,
  onChange,
  label = "Travel Date"
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = getTodayInputDate();
  const maxDate = getMaxTravelDate();

  function openCalendar() {
    const input = inputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (input.showPicker) {
      input.showPicker();
      return;
    }
    input.focus();
    input.click();
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        aria-label={label}
        className="sr-only"
        type="date"
        min={today}
        max={maxDate}
        value={value}
        onChange={(event) => onChange(clampTravelDate(event.target.value))}
      />
      <button
        type="button"
        className="flex h-full min-h-[52px] w-full items-center gap-3 rounded-xl border border-sand bg-cream px-3 py-2 text-left text-ink transition hover:border-primary hover:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40 md:min-h-[48px] md:rounded-2xl"
        onClick={openCalendar}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Calendar size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
          <span className="block truncate text-sm font-bold">{formatTravelDate(value)}</span>
        </span>
      </button>
    </div>
  );
}
