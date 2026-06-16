import type { SavedPassenger } from "../types";

// One traveller per booked seat. Stored as strings for easy form binding.
export type SeatEntry = {
  savedId: string; // "" or "new" -> manual entry; otherwise a SavedPassenger id
  full_name: string;
  age: string;
  gender: string;
  save: boolean;
};

export const emptySeatEntry = (full_name = ""): SeatEntry => ({
  savedId: "",
  full_name,
  age: "",
  gender: "",
  save: false,
});

export default function PassengerSeats({
  entries,
  onChange,
  savedPassengers,
}: {
  entries: SeatEntry[];
  onChange: (entries: SeatEntry[]) => void;
  savedPassengers: SavedPassenger[];
}) {
  function update(index: number, patch: Partial<SeatEntry>) {
    onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function chooseSaved(index: number, value: string) {
    if (value && value !== "new") {
      const sp = savedPassengers.find((p) => String(p.id) === value);
      update(index, {
        savedId: value,
        full_name: sp?.full_name ?? "",
        age: sp?.age != null ? String(sp.age) : "",
        gender: sp?.gender ?? "",
        save: false,
      });
    } else {
      update(index, { savedId: value });
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry, index) => {
        const manual = entry.savedId === "" || entry.savedId === "new";
        return (
          <div key={index} className="rounded-xl border border-sand bg-cream p-3">
            <p className="mb-2 text-xs font-bold text-muted">Passenger {index + 1}</p>
            {savedPassengers.length > 0 && (
              <select
                className="input"
                value={entry.savedId}
                onChange={(event) => chooseSaved(index, event.target.value)}
              >
                <option value="">Enter passenger details</option>
                {savedPassengers.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.full_name}
                    {p.age != null ? ` · ${p.age}` : ""}
                    {p.gender ? ` · ${p.gender}` : ""}
                  </option>
                ))}
                <option value="new">+ Add a new passenger</option>
              </select>
            )}
            {manual && (
              <>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <input
                    className="input"
                    placeholder="Full name"
                    value={entry.full_name}
                    onChange={(event) => update(index, { full_name: event.target.value })}
                  />
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={120}
                    placeholder="Age"
                    value={entry.age}
                    onChange={(event) => update(index, { age: event.target.value })}
                  />
                  <select
                    className="input"
                    value={entry.gender}
                    onChange={(event) => update(index, { gender: event.target.value })}
                  >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={entry.save}
                    onChange={(event) => update(index, { save: event.target.checked })}
                  />
                  Save this passenger to my account
                </label>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
