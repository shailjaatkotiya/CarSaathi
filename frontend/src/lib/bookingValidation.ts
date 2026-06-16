import type { SavedPassenger } from "../types";
import type { SeatEntry } from "../components/PassengerSeats";

export function validatePassengerEntries(
  entries: SeatEntry[],
  savedPassengers: SavedPassenger[]
): string | null {
  const totalSeats = entries.length;
  let completeCount = 0;

  for (const entry of entries) {
    if (entry.savedId && entry.savedId !== "new") {
      const saved = savedPassengers.find((p) => String(p.id) === entry.savedId);
      if (saved) {
        completeCount += 1;
      }
      continue;
    }

    if (entry.full_name.trim()) {
      completeCount += 1;
    }
  }

  if (completeCount !== totalSeats) {
    return "Please fill in passenger details for all selected seats.";
  }

  return null;
}
