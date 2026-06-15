import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

function parseTimeValue(value: string) {
  const [rawHours = "00", rawMinutes = "00"] = value.split(":");
  const hours24 = Math.min(23, Math.max(0, Number(rawHours) || 0));
  const minutes = Math.min(59, Math.max(0, Number(rawMinutes) || 0));
  const period = hours24 >= 12 ? "PM" : "AM";
  const displayHour = hours24 % 12 || 12;

  return {
    hoursInput: String(displayHour).padStart(2, "0"),
    minutesInput: String(minutes).padStart(2, "0"),
    period: period as "AM" | "PM",
  };
}

function to24HourValue(hours: number, minutes: number, period: "AM" | "PM") {
  let hours24 = hours;
  if (period === "PM" && hours !== 12) hours24 += 12;
  if (period === "AM" && hours === 12) hours24 = 0;
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
    setPeriod(parsed.period);
  }, [value]);

  function commit(h: string, m: string, p: "AM" | "PM") {
    const hours = Math.min(12, Math.max(1, Number(h) || 1));
    const minutes = Math.min(59, Math.max(0, Number(m) || 0));
    setHoursInput(String(hours).padStart(2, "0"));
    setMinutesInput(String(minutes).padStart(2, "0"));
    onChange(to24HourValue(hours, minutes, p));
  }

  function stepHours(delta: number) {
    const current = Math.min(12, Math.max(1, Number(hoursInput) || 1));
    const next = ((current - 1 + delta + 12) % 12) + 1;
    const nextStr = String(next).padStart(2, "0");
    setHoursInput(nextStr);
    onChange(to24HourValue(next, Math.min(59, Math.max(0, Number(minutesInput) || 0)), period));
  }

  function stepMinutes(delta: number) {
    const current = Math.min(59, Math.max(0, Number(minutesInput) || 0));
    const next = (current + delta + 60) % 60;
    const nextStr = String(next).padStart(2, "0");
    setMinutesInput(nextStr);
    onChange(to24HourValue(Math.min(12, Math.max(1, Number(hoursInput) || 1)), next, period));
  }

  const spinBtn = "flex h-4 w-4 items-center justify-center rounded text-muted transition hover:bg-sand hover:text-ink active:scale-95";

  return (
    <div className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border border-sand bg-cream px-3 py-2 text-ink md:min-h-[48px] md:rounded-2xl">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-white">
        <Clock size={17} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
        <div className="flex items-center gap-1">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              aria-label="Hour"
              className="w-9 rounded-lg border border-sand bg-white px-1 py-0.5 text-center text-sm font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40"
              value={hoursInput}
              onChange={(e) => setHoursInput(e.target.value.replace(/\D/g, "").slice(0, 2))}
              onBlur={() => commit(hoursInput, minutesInput, period)}
              onWheel={(e) => {
                e.preventDefault();
                stepHours(e.deltaY < 0 ? 1 : -1);
              }}
            />
          </div>

          <span className="mb-0.5 font-bold text-muted">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={2}
              aria-label="Minute"
              className="w-9 rounded-lg border border-sand bg-white px-1 py-0.5 text-center text-sm font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40"
              value={minutesInput}
              onChange={(e) => setMinutesInput(e.target.value.replace(/\D/g, "").slice(0, 2))}
              onBlur={() => commit(hoursInput, minutesInput, period)}
              onWheel={(e) => {
                e.preventDefault();
                stepMinutes(e.deltaY < 0 ? 1 : -1);
              }}
            />
          </div>

          {/* AM/PM */}
          <select
            aria-label="AM or PM"
            className="self-center rounded-lg border border-sand bg-white px-1 py-0.5 text-sm font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light/40"
            value={period}
            onChange={(e) => {
              const next = e.target.value as "AM" | "PM";
              setPeriod(next);
              commit(hoursInput, minutesInput, next);
            }}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  );
}
