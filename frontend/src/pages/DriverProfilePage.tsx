import { CheckCircle2, MessageCircle, User as UserIcon, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api/client";

type DriverBooking = {
  id: number;
  booking_code: string;
  status: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  passenger_name: string;
  passenger_whatsapp?: string;
  route: string;
  journey_date: string;
  departure_time: string;
};

export default function DriverProfilePage() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { data: driverBookings, refetch } = useQuery({
    queryKey: ["driver-profile-bookings"],
    queryFn: async () => (await api.get<DriverBooking[]>("/driver/bookings/active")).data
  });

  async function acceptBooking(bookingId: number) {
    setMessage("");
    setError("");
    try {
      await api.post(`/driver/bookings/${bookingId}/accept`);
      setMessage("Booking accepted. Confirmation WhatsApp message has been sent to the passenger.");
      refetch();
    } catch {
      setError("Could not accept the booking. Please try again.");
    }
  }

  async function rejectBooking(bookingId: number) {
    setMessage("");
    setError("");
    try {
      await api.post(`/driver/bookings/${bookingId}/reject`);
      setMessage("Booking rejected and seats released back to the ride.");
      refetch();
    } catch {
      setError("Could not reject the booking. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="card-soft rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold">Driver Profile</h1>
          <p className="mt-2 text-muted">Passenger details for all non-completed bookings on your rides.</p>
        </div>
        {message && <p className="alert-success">{message}</p>}
        {error && <p className="alert-error">{error}</p>}

        {driverBookings?.map((booking) => (
          <div key={booking.id} className="card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <h3 className="font-bold">{booking.passenger_name}</h3>
                <p className="text-sm text-muted">
                  {booking.route} · {booking.journey_date} at {booking.departure_time.slice(0, 5)}
                </p>
                <p className="text-sm text-muted">
                  {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
                </p>
              </div>
              <span className="chip self-start">{booking.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip-outline">
                <UserIcon size={14} />
                {booking.booking_code}
              </span>
              <span className="chip-outline">
                <MessageCircle size={14} />
                {booking.passenger_whatsapp || "No WhatsApp"}
              </span>
              {booking.status === "pending" && (
                <>
                  <button type="button" className="btn-primary" onClick={() => acceptBooking(booking.id)}>
                    <CheckCircle2 size={16} />
                    Accept
                  </button>
                  <button type="button" className="btn-danger" onClick={() => rejectBooking(booking.id)}>
                    <XCircle size={16} />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {driverBookings?.length === 0 && <p className="alert-info">No passenger details yet.</p>}
      </div>
    </div>
  );
}
