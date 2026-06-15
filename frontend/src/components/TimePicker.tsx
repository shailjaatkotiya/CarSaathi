import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [hoursInput, setHoursInput] = useState("07");
  const [minutesInput, setMinutesInput] = useState("00");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    const parsed = parseTimeValue(value || "07:00");
    setHoursInput(parsed.hoursInput);
    setMinutesInput(parsed.minutesInput);
    setPeriod(parsed.period as "AM" | "PM");
  }, [value]);

  function updateTime(
    nextHours: string,
    nextMinutes: string,
    nextPeriod: "AM" | "PM",
  ) {
    const nextValue = to24HourValue(nextHours, nextMinutes, nextPeriod);
    onChange(nextValue);
  }

  const timeLabel = formatTimeLabel(value || "07:00");

  return (
    <div className="flex h-full min-h-[52px] w-full items-center gap-3 rounded-xl border border-sand bg-cream px-3 py-2 text-ink md:min-h-[48px] md:rounded-2xl">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
        <Clock size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-muted">
          {label}
        </span>
        <span className="block truncate text-sm font-bold text-primary">
          {timeLabel}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          aria-label="Hour"
          className="w-10 rounded-lg border border-sand bg-white px-1 py-1 text-center text-sm font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40"
          value={hoursInput}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
            const safe = String(Math.min(12, Math.max(0, Number(raw) || 0))).padStart(2, "0");
            setHoursInput(safe);
            updateTime(safe, minutesInput, period);
          }}
        />
        <span className="font-bold text-muted">:</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          aria-label="Minute"
          className="w-10 rounded-lg border border-sand bg-white px-1 py-1 text-center text-sm font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40"
          value={minutesInput}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, "").slice(0, 2);
            const safe = String(Math.min(59, Math.max(0, Number(raw) || 0))).padStart(2, "0");
            setMinutesInput(safe);
            updateTime(hoursInput, safe, period);
          }}
        />
        <select
          aria-label="AM or PM"
          className="rounded-lg border border-sand bg-white px-1 py-1 text-sm font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40"
          value={period}
          onChange={(e) => {
            const next = e.target.value as "AM" | "PM";
            setPeriod(next);
            updateTime(hoursInput, minutesInput, next);
          }}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
