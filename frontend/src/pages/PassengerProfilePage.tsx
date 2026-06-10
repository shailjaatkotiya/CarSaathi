import { Ticket, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";

type Booking = {
  id: number;
  booking_code: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

export default function PassengerProfilePage() {
  const [message, setMessage] = useState("");
  const { data: passengerBookings, refetch } = useQuery({
    queryKey: ["passenger-profile-bookings"],
    queryFn: async () => (await api.get<Booking[]>("/passenger/bookings")).data
  });

  async function cancelBooking(bookingId: number) {
    await api.post(`/passenger/bookings/${bookingId}/cancel`, { reason: "Passenger cancelled from profile" });
    setMessage("Booking cancelled. WhatsApp cancellation message has been logged.");
    refetch();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="card-soft rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold">Passenger Profile</h1>
          <p className="mt-2 text-muted">Booked rides that are not completed yet.</p>
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
                  {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
                </p>
                <span className="chip mt-2">
                  {booking.status} · Rs. {booking.total_amount}
                </span>
              </div>
              {["pending", "confirmed"].includes(booking.status) && (
                <button type="button" className="btn-danger self-stretch sm:self-center" onClick={() => cancelBooking(booking.id)}>
                  <XCircle size={16} />
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}

        {passengerBookings?.length === 0 && <p className="alert-info">No unfinished booked rides yet.</p>}
      </div>
    </div>
  );
}
