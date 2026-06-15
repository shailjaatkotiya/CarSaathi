import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

function toInputDate(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function fromInputDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function addDays(value: string, days: number) {
  const date = fromInputDate(value);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

function getMonthKey(value: string) {
  return value.slice(0, 7);
}

function getCalendarDays(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const start = new Date(firstOfMonth);
  start.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      value: toInputDate(date),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month - 1
    };
  });
}

function getMonthLabel(monthKey: string) {
  return fromInputDate(`${monthKey}-01`).toLocaleDateString("en-IN", {
    month: "long",
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const today = getTodayInputDate();
  const maxDate = getMaxTravelDate();
  const selectedDate = clampTravelDate(value);
  const [visibleMonth, setVisibleMonth] = useState(getMonthKey(selectedDate));
  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const canGoPrevious = visibleMonth > getMonthKey(today);
  const canGoNext = visibleMonth < getMonthKey(maxDate);

  useEffect(() => {
    setVisibleMonth(getMonthKey(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  function moveMonth(direction: -1 | 1) {
    const monthDate = fromInputDate(`${visibleMonth}-01`);
    monthDate.setMonth(monthDate.getMonth() + direction);
    const nextMonth = getMonthKey(toInputDate(monthDate));
    if (nextMonth < getMonthKey(today) || nextMonth > getMonthKey(maxDate)) return;
    setVisibleMonth(nextMonth);
  }

  function selectDate(nextDate: string) {
    if (nextDate < today || nextDate > maxDate) return;
    onChange(clampTravelDate(nextDate));
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="flex h-full min-h-[52px] w-full items-center gap-3 rounded-xl border border-sand bg-cream px-3 py-2 text-left text-ink transition hover:border-primary hover:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40 md:min-h-[48px] md:rounded-2xl"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Calendar size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
          <span className="block truncate text-sm font-bold">{formatTravelDate(selectedDate)}</span>
        </span>
      </button>
      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-sand bg-white p-3 text-ink shadow-card"
          role="dialog"
          aria-label={`${label} calendar`}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-sand bg-cream text-ink transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => moveMonth(-1)}
              disabled={!canGoPrevious}
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>
            <div className="text-sm font-bold">{getMonthLabel(visibleMonth)}</div>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-sand bg-cream text-ink transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => moveMonth(1)}
              disabled={!canGoNext}
              aria-label="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-muted">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <span key={day} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isSelected = day.value === selectedDate;
              const isToday = day.value === today;
              const isDisabled = day.value < today || day.value > maxDate;
              return (
                <button
                  key={day.value}
                  type="button"
                  className={`grid h-9 place-items-center rounded-xl text-sm font-semibold transition ${
                    isSelected
                      ? "bg-primary text-white shadow-soft"
                      : isDisabled
                      ? "cursor-not-allowed text-muted/35"
                      : day.isCurrentMonth
                      ? "text-ink hover:bg-primary-soft"
                      : "text-muted hover:bg-sand-light"
                  } ${isToday && !isSelected ? "ring-1 ring-primary" : ""}`}
                  onClick={() => selectDate(day.value)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                >
                  {day.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-sand pt-3">
            <button type="button" className="text-xs font-bold text-muted transition hover:text-primary" onClick={() => setIsOpen(false)}>
              Close
            </button>
            <button type="button" className="chip-outline border-primary text-primary" onClick={() => selectDate(today)}>
              Today
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-muted">Choose a date up to 10 days ahead.</p>
        </div>
      )}
    </div>
  );
}
