import {
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  const [form, setForm] = useState<PassengerForm>(emptyForm);
  const [editingPassenger, setEditingPassenger] =
    useState<SavedPassenger | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
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
      setMessage(editingPassenger ? "Passenger updated." : "Passenger added.");
      closeDialog();
      await invalidate();
    },
    onError: (err) =>
      setError(apiErrorMessage(err, "Could not save the passenger.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookingsApi.deleteSavedPassenger(id),
    onSuccess: async (_, deletedId) => {
      if (editingPassenger?.id === deletedId) {
        closeDialog();
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

  function openAdd() {
    setEditingPassenger(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setDialogOpen(true);
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
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
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
    <div className="flex flex-col gap-3">
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={openAdd}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-ink transition hover:bg-sand-light"
        >
          <span className="shrink-0 text-muted">
            <Plus size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Add passenger</span>
            <span className="mt-0.5 block text-xs text-muted">
              Save co-traveller details to reuse when booking multiple seats.
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-muted" />
        </button>
      </div>

      {message && <p className="alert-success">{message}</p>}

      {(passengers?.length ?? 0) > 0 && (
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-ink transition hover:bg-sand-light"
          >
            <span className="shrink-0 text-muted">
              <Users size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">My passengers</span>
              <span className="mt-0.5 block text-xs text-muted">
                {passengers?.length === 1
                  ? "1 saved co-traveller"
                  : `${passengers?.length} saved co-travellers`}
              </span>
            </span>
            <ChevronRight
              size={16}
              className={`shrink-0 text-muted transition-transform ${
                listOpen ? "rotate-90" : ""
              }`}
            />
          </button>

          {listOpen &&
            passengers?.map((passenger) => (
              <div
                key={passenger.id}
                className="flex flex-col gap-2 border-t border-sand-light px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Users size={14} className="text-primary" />
                    {passenger.full_name}
                  </p>
                  <p className="text-xs text-muted">
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
        </div>
      )}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeDialog}
        >
          <div
            className="card w-full max-w-lg rounded-2xl p-4 md:p-5 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={submit} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold md:text-2xl">
                    {editingPassenger
                      ? `Edit passenger ${editingPassenger.full_name}`
                      : "Add passenger"}
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    Save co-traveller details once and reuse them when booking
                    multiple seats.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full p-1 text-muted transition hover:bg-sand-light hover:text-ink"
                  onClick={closeDialog}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Full name"
                  value={form.full_name}
                  onChange={(event) =>
                    setField("full_name", event.target.value)
                  }
                  autoFocus
                  required
                />
                <div>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={120}
                    placeholder="Age"
                    value={form.age}
                    onChange={(event) => setField("age", event.target.value)}
                  />
                </div>
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
                <div>
                  <input
                    className="input"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                  />
                </div>
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
                <button
                  type="button"
                  className="btn-outline"
                  onClick={closeDialog}
                >
                  Cancel
                </button>
              </div>
              {error && <p className="alert-error">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
