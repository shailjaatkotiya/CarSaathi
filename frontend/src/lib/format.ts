// Pure formatting helpers. No React, no network — easy to unit test.

// Build a wa.me chat link from a phone number. Assumes India (+91) when no
// country code is present. Returns null for empty/invalid numbers.
export function whatsappLink(number?: string | null): string | null {
  if (!number) return null;
  let digits = number.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) digits = `91${digits}`;
  return `https://wa.me/${digits}`;
}

// "07:30:00" / "07:30" -> "7:30 AM".
export function formatTimeAmPm(time: string): string {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

// "2026-06-16" -> "16 Jun 2026".
export function formatShortDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
