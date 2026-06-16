import { Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { bookingsApi, type SavedPassengerPayload } from "../api/bookings";
import { apiErrorMessage } from "../lib/apiError";
import { queryKeys } from "../lib/queryKeys";
import type { SavedPassenger } from "../types";

type PassengerForm = {
  full_name: string;
  age: string;
  gender: string;
  phone: string;
};

const emptyForm: PassengerForm = {
  full_name: "",
  age: "",
  gender: "",
  phone: "",
};

function payloadFromForm(form: PassengerForm): SavedPassengerPayload {
  return {
    full_name: form.full_name.trim(),
    age: form.age ? Number(form.age) : null,
    gender: form.gender || null,
    phone: form.phone.trim() || null,
  };
}

function passengerMeta(passenger: SavedPassenger) {
  return [
    passenger.age != null ? `${passenger.age} years` : null,
    passenger.gender,
    passenger.phone,
  ]
    .filter(Boolean)
    .join(" - ");
}

// Account-level co-traveller list, the passenger-side analogue of saved
// vehicles for drivers. Add, update, or remove people to reuse while booking.
export default function SavedPassengersManager() {
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<PassengerForm>(emptyForm);
  const [editingPassenger, setEditingPassenger] =
    useState<SavedPassenger | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { data: passengers } = useQuery({
    queryKey: queryKeys.passenger.savedPassengers,
    queryFn: bookingsApi.savedPassengers,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.passenger.savedPassengers,
    });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = payloadFromForm(form);
      if (editingPassenger) {
        return bookingsApi.updateSavedPassenger(editingPassenger.id, payload);
      }
      return bookingsApi.addSavedPassenger(payload);
    },
    onSuccess: async () => {
      setForm(emptyForm);
      setEditingPassenger(null);
      setError("");
      setMessage(editingPassenger ? "Passenger updated." : "Passenger added.");
      await invalidate();
    },
    onError: (err) =>
      setError(apiErrorMessage(err, "Could not save the passenger.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.deleteSavedPassenger(id),
    onSuccess: async (_, deletedId) => {
      if (editingPassenger?.id === deletedId) {
        cancelEdit();
      }
      setMessage("Passenger deleted.");
      setError("");
      await invalidate();
    },
    onError: (err) =>
      setError(apiErrorMessage(err, "Could not delete the passenger.")),
  });

  function setField(field: keyof PassengerForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(passenger: SavedPassenger) {
    setEditingPassenger(passenger);
    setForm({
      full_name: passenger.full_name,
      age: passenger.age != null ? String(passenger.age) : "",
      gender: passenger.gender ?? "",
      phone: passenger.phone ?? "",
    });
    setMessage("");
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingPassenger(null);
    setForm(emptyForm);
    setError("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.full_name.trim()) {
      setError("Enter the passenger's name.");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="card rounded-2xl p-4 md:p-5">
        <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold md:text-xl">
              {editingPassenger
                ? `Edit passenger ${editingPassenger.full_name}`
                : "Add passenger"}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Save co-traveller details once and reuse them when booking
              multiple seats.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Full name"
              value={form.full_name}
              onChange={(event) => setField("full_name", event.target.value)}
              required
            />
            <input
              className="input"
              type="number"
              min={0}
              max={120}
              placeholder="Age"
              value={form.age}
              onChange={(event) => setField("age", event.target.value)}
            />
            <select
              className="input"
              value={form.gender}
              onChange={(event) => setField("gender", event.target.value)}
            >
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              className="input"
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) => setField("phone", event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              className="btn-primary self-start px-6 py-3 text-base"
              type="submit"
              disabled={saveMutation.isPending}
            >
              <UserPlus size={16} />
              {editingPassenger ? "Update passenger" : "Save passenger"}
            </button>
            {editingPassenger && (
              <button type="button" className="btn-outline" onClick={cancelEdit}>
                Cancel edit
              </button>
            )}
          </div>
          {message && <p className="alert-success">{message}</p>}
          {error && <p className="alert-error">{error}</p>}
        </form>
      </div>

      <div className="card overflow-hidden rounded-3xl">
        <div className="border-b border-sand px-5 py-4 font-bold">
          My passengers
        </div>
        {passengers?.map((passenger) => (
          <div
            key={passenger.id}
            className="flex flex-col gap-2 border-b border-sand-light px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="inline-flex items-center gap-2 font-semibold">
                <Users size={16} className="text-primary" />
                {passenger.full_name}
              </p>
              <p className="text-sm text-muted">
                {passengerMeta(passenger) || "No optional details added"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn-outline"
                onClick={() => startEdit(passenger)}
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                className="btn-outline text-red-600 hover:border-red-400 hover:text-red-700"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(passenger.id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
        {passengers?.length === 0 && (
          <p className="px-5 py-4 text-sm text-muted">
            No passengers added yet.
          </p>
        )}
      </div>
    </div>
  );
}
