// Pure formatting helpers. No React, no network — easy to unit test.

// Build a wa.me chat link from a phone number. Assumes India (+91) when no
// country code is present. Returns null for empty/invalid numbers.
export function whatsappLink(number?: string | null, text?: string): string | null {
  if (!number) return null;
  let digits = number.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = `91${digits}`;
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// Pretext for a WhatsApp chat about a ride: From, To, Date, Time.
export function rideChatPretext(args: {
  route: string;
  journey_date: string;
  departure_time: string;
}): string {
  const [from, to] = args.route.split(/\s+to\s+/i);
  return [
    "Hi! Regarding our Carthi ride:",
    `From: ${from ?? args.route}`,
    `To: ${to ?? ""}`,
    `Date: ${formatShortDate(args.journey_date)}`,
    `Time: ${formatTimeAmPm(args.departure_time)}`,
  ].join("\n");
}

// "07:30:00" / "07:30" -> "7:30 AM".
export function formatTimeAmPm(time: string): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

// A ride is treated as "on going" for this long after its departure time,
// after which it is considered completed. Mirrors RIDE_DURATION_HOURS on the
// backend (no end time is stored).
export const RIDE_DURATION_MS = 6 * 60 * 60 * 1000;

function departureDate(journeyDate: string, departureTime: string): Date | null {
  if (!journeyDate || !departureTime) return null;
  const time = departureTime.length === 5 ? `${departureTime}:00` : departureTime;
  const departure = new Date(`${journeyDate}T${time}`);
  return Number.isNaN(departure.getTime()) ? null : departure;
}

// Departure as epoch ms for sorting (most-upcoming first). Missing/invalid
// dates sort last via Number.POSITIVE_INFINITY.
export function rideStartMs(journeyDate: string, departureTime: string): number {
  const departure = departureDate(journeyDate, departureTime);
  return departure ? departure.getTime() : Number.POSITIVE_INFINITY;
}

// True when a ride's departure date+time is at or before the current moment.
// journeyDate: "YYYY-MM-DD", departureTime: "HH:MM" or "HH:MM:SS".
export function rideTimePassed(journeyDate: string, departureTime: string): boolean {
  const departure = departureDate(journeyDate, departureTime);
  return departure ? departure.getTime() <= Date.now() : false;
}

// Lifecycle phase derived purely from the clock:
//   upcoming -> before departure
//   ongoing  -> departure passed, within RIDE_DURATION_MS
//   ended    -> more than RIDE_DURATION_MS after departure
export function ridePhase(journeyDate: string, departureTime: string): "upcoming" | "ongoing" | "ended" {
  const departure = departureDate(journeyDate, departureTime);
  if (!departure) return "upcoming";
  const now = Date.now();
  if (now >= departure.getTime() + RIDE_DURATION_MS) return "ended";
  if (now >= departure.getTime()) return "ongoing";
  return "upcoming";
}

// "2026-06-16" -> "16 Jun 2026".
export function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
