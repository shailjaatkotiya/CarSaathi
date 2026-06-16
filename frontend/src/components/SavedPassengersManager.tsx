import { Trash2, UserPlus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { bookingsApi } from "../api/bookings";
import { apiErrorMessage } from "../lib/apiError";
import { queryKeys } from "../lib/queryKeys";

// Account-level co-traveller list, the passenger-side analogue of saved
// vehicles for drivers. Add/remove people to reuse while booking.
export default function SavedPassengersManager() {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  const { data: passengers } = useQuery({
    queryKey: queryKeys.passenger.savedPassengers,
    queryFn: bookingsApi.savedPassengers,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.passenger.savedPassengers });

  const addMutation = useMutation({
    mutationFn: () =>
      bookingsApi.addSavedPassenger({
        full_name: fullName.trim(),
        age: age ? Number(age) : null,
        gender: gender || null,
      }),
    onSuccess: () => {
      setFullName("");
      setAge("");
      setGender("");
      setError("");
      invalidate();
    },
    onError: (err) => setError(apiErrorMessage(err, "Could not save the passenger.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.deleteSavedPassenger(id),
    onSuccess: invalidate,
  });

  function add() {
    if (!fullName.trim()) {
      setError("Enter the passenger's name.");
      return;
    }
    addMutation.mutate();
  }

  return (
    <div className="card rounded-2xl p-4 md:p-5">
      <h2 className="text-lg font-bold">Saved passengers</h2>
      <p className="mt-1 text-sm text-muted">
        Add co-travellers once and reuse them when booking multiple seats.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {passengers?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-sand bg-cream px-3 py-2"
          >
            <div className="text-sm">
              <span className="font-bold">{p.full_name}</span>
              <span className="text-muted">
                {p.age != null ? ` · ${p.age}` : ""}
                {p.gender ? ` · ${p.gender}` : ""}
              </span>
            </div>
            <button
              type="button"
              className="text-muted transition hover:text-red-600"
              onClick={() => deleteMutation.mutate(p.id)}
              aria-label={`Remove ${p.full_name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {passengers?.length === 0 && (
          <p className="alert-info">No saved passengers yet.</p>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input
          className="input"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <input
          className="input"
          type="number"
          min={0}
          max={120}
          placeholder="Age"
          value={age}
          onChange={(event) => setAge(event.target.value)}
        />
        <select className="input" value={gender} onChange={(event) => setGender(event.target.value)}>
          <option value="">Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      {error && <p className="alert-error mt-2">{error}</p>}
      <button type="button" className="btn-primary mt-3" onClick={add} disabled={addMutation.isPending}>
        <UserPlus size={16} />
        Add passenger
      </button>
    </div>
  );
}
