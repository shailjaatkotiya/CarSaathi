import { Flag, Star, Ticket, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import axios from "axios";
import { api } from "../api/client";

type Booking = {
  id: number;
  booking_code: string;
  ride_id: number;
  driver_id: number;
  driver_name: string;
  route: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

function ReviewForm({ booking, onDone }: { booking: Booking; onDone: (message: string) => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function submitReview() {
    setError("");
    try {
      await api.post(`/passenger/bookings/${booking.id}/review`, { rating, comment: comment.trim() || null });
      onDone(`Review submitted for ${booking.driver_name}. Thank you!`);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not submit the review. You may have already reviewed this booking.");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
      <p className="font-bold">Rate driver {booking.driver_name}</p>
      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value} stars`}>
            <Star size={22} className={value <= rating ? "fill-amber-400 text-amber-400" : "text-muted"} />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted">{rating}/5</span>
      </div>
      <textarea
        className="input mt-3"
        rows={2}
        placeholder="Optional comment about the ride"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {error && <p className="alert-error mt-2">{error}</p>}
      <button type="button" className="btn-primary mt-3" onClick={submitReview}>
        Submit review
      </button>
    </div>
  );
}

function ReportForm({ booking, onDone }: { booking: Booking; onDone: (message: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function submitReport() {
    setError("");
    if (!reason.trim()) {
      setError("Please describe the issue before submitting the report.");
      return;
    }
    try {
      await api.post("/passenger/reports", {
        reported_user_id: booking.driver_id,
        ride_id: booking.ride_id,
        reason: reason.trim()
      });
      onDone("Report submitted. Our admin team will review it.");
    } catch {
      setError("Could not submit the report. Please try again.");
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
      <p className="font-bold">Report driver {booking.driver_name}</p>
      <textarea
        className="input mt-3"
        rows={2}
        placeholder="Describe what went wrong"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      {error && <p className="alert-error mt-2">{error}</p>}
      <button type="button" className="btn-danger mt-3" onClick={submitReport}>
        Submit report
      </button>
    </div>
  );
}

export default function PassengerProfilePage() {
  const [message, setMessage] = useState("");
  const [openForm, setOpenForm] = useState<{ bookingId: number; type: "review" | "report" } | null>(null);
  const { data: passengerBookings, refetch } = useQuery({
    queryKey: ["passenger-profile-bookings"],
    queryFn: async () => (await api.get<Booking[]>("/passenger/bookings")).data
  });

  async function cancelBooking(bookingId: number) {
    await api.post(`/passenger/bookings/${bookingId}/cancel`, { reason: "Passenger cancelled from profile" });
    setMessage("Booking cancelled. WhatsApp cancellation message has been logged.");
    refetch();
  }

  function handleFormDone(text: string) {
    setMessage(text);
    setOpenForm(null);
    refetch();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="card-soft rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold">Booked Rides</h1>
          <p className="mt-2 text-muted">Your booked rides that are not completed yet.</p>
        </div>
        {message && <p className="alert-success">{message}</p>}

        {passengerBookings?.map((booking) => (
          <div key={booking.id} className="card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <div className="flex items-center gap-2">
                  <Ticket size={18} className="text-primary" />
                  <h3 className="font-bold">{booking.booking_code}</h3>
                </div>
                <p className="text-sm text-muted">
                  {booking.route} · driver {booking.driver_name}
                </p>
                <p className="text-sm text-muted">
                  {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
                </p>
                <span className="chip mt-2">
                  {booking.status} · Rs. {booking.total_amount}
                </span>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                {["pending", "confirmed"].includes(booking.status) && (
                  <button type="button" className="btn-danger" onClick={() => cancelBooking(booking.id)}>
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}
                {["confirmed", "completed"].includes(booking.status) && (
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() =>
                      setOpenForm((current) =>
                        current?.bookingId === booking.id && current.type === "review" ? null : { bookingId: booking.id, type: "review" }
                      )
                    }
                  >
                    <Star size={16} />
                    Rate driver
                  </button>
                )}
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() =>
                    setOpenForm((current) =>
                      current?.bookingId === booking.id && current.type === "report" ? null : { bookingId: booking.id, type: "report" }
                    )
                  }
                >
                  <Flag size={16} />
                  Report driver
                </button>
              </div>
            </div>
            {openForm?.bookingId === booking.id && openForm.type === "review" && <ReviewForm booking={booking} onDone={handleFormDone} />}
            {openForm?.bookingId === booking.id && openForm.type === "report" && <ReportForm booking={booking} onDone={handleFormDone} />}
          </div>
        ))}

        {passengerBookings?.length === 0 && <p className="alert-info">No unfinished booked rides yet.</p>}
      </div>
    </div>
  );
}
