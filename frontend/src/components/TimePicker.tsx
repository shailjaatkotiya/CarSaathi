import { Clock, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatTimeLabel(value: string) {
  if (!value) return "Select time";

  const [rawHours = "00", rawMinutes = "00"] = value.split(":");
  const hours24 = Number(rawHours) || 0;
  const minutes = Number(rawMinutes) || 0;
  const suffix = hours24 >= 12 ? "PM" : "AM";
  const displayHour = hours24 % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function parseTimeValue(value: string) {
  const [rawHours = "00", rawMinutes = "00"] = value.split(":");
  const hours24 = Math.min(23, Math.max(0, Number(rawHours) || 0));
  const minutes = Math.min(59, Math.max(0, Number(rawMinutes) || 0));
  const period = hours24 >= 12 ? "PM" : "AM";
  const displayHour = hours24 % 12 || 12;

  return {
    hoursInput: String(displayHour).padStart(2, "0"),
    minutesInput: String(minutes).padStart(2, "0"),
    period,
    value: `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}

function to24HourValue(
  hoursInput: string,
  minutesInput: string,
  period: "AM" | "PM",
) {
  const rawHours = Math.min(12, Math.max(0, Number(hoursInput) || 0));
  const rawMinutes = Math.min(60, Math.max(0, Number(minutesInput) || 0));

  let hours24 = rawHours;
  if (period === "PM" && rawHours !== 12) hours24 += 12;
  if (period === "AM" && rawHours === 12) hours24 = 0;

  let minutes = rawMinutes;
  if (minutes === 60) {
    hours24 = (hours24 + 1) % 24;
    minutes = 0;
  }

  return `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export default function TimePicker({
  value,
  onChange,
  label = "Time",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState(value || "00:00");
  const [hoursInput, setHoursInput] = useState("00");
  const [minutesInput, setMinutesInput] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    const parsed = parseTimeValue(value || "00:00");
    setHoursInput(parsed.hoursInput);
    setMinutesInput(parsed.minutesInput);
    setPeriod(parsed.period as "AM" | "PM");
    setSelectedTime(parsed.value);
  }, [value]);

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

  function handleTimeChange(nextValue: string) {
    setSelectedTime(nextValue);
    onChange(nextValue);
  }

  function updateTime(
    nextHours: string,
    nextMinutes: string,
    nextPeriod: "AM" | "PM",
  ) {
    const nextValue = to24HourValue(nextHours, nextMinutes, nextPeriod);
    handleTimeChange(nextValue);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-full min-h-[52px] w-full items-center gap-3 rounded-xl border border-sand bg-cream px-3 py-2 text-left text-ink transition hover:border-primary hover:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40 md:min-h-[48px] md:rounded-2xl"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Clock size={17} />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">
            {label}
          </span>
          <span className="block truncate text-sm font-bold">
            {formatTimeLabel(selectedTime)}
          </span>
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-sand bg-white p-3 text-ink shadow-card"
          role="dialog"
          aria-label={`${label} selector`}
        >
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="field-label mb-0">Hour (00-12)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                className="input"
                value={hoursInput}
                onChange={(event) => {
                  const nextValue = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 2);
                  const safeValue = Math.min(
                    12,
                    Math.max(0, Number(nextValue) || 0),
                  );
                  setHoursInput(String(safeValue).padStart(2, "0"));
                  updateTime(
                    String(safeValue).padStart(2, "0"),
                    minutesInput,
                    period,
                  );
                }}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="field-label mb-0">Minute (00-59)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={2}
                className="input"
                value={minutesInput}
                onChange={(event) => {
                  const nextValue = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 2);
                  const safeValue = Math.min(
                    60,
                    Math.max(0, Number(nextValue) || 0),
                  );
                  setMinutesInput(String(safeValue).padStart(2, "0"));
                  updateTime(
                    hoursInput,
                    String(safeValue).padStart(2, "0"),
                    period,
                  );
                }}
              />
            </label>
          </div>
          <label className="mt-3 flex flex-col gap-1">
            <span className="field-label mb-0">AM / PM</span>
            <select
              className="input"
              value={period}
              onChange={(event) => {
                const nextPeriod = event.target.value as "AM" | "PM";
                setPeriod(nextPeriod);
                updateTime(hoursInput, minutesInput, nextPeriod);
              }}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
