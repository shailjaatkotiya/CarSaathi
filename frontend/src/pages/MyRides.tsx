import { CheckCircle2, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";

type RideBooking = {
  id: number;
  booking_code: string;
  passenger_id: number;
  passenger_name: string;
  passenger_whatsapp?: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

function RideBookings({
  rideId,
  onMessage,
  onRideChanged
}: {
  rideId: number;
  onMessage: (message: string) => void;
  onRideChanged: () => void;
}) {
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["ride-bookings", rideId],
    queryFn: async () => (await api.get<RideBooking[]>(`/driver/rides/${rideId}/bookings`)).data
  });

  async function acceptBooking(bookingId: number) {
    await api.post(`/driver/bookings/${bookingId}/accept`);
    onMessage("Booking accepted. Passenger confirmation WhatsApp has been logged.");
    await refetch();
    onRideChanged();
  }

  async function rejectBooking(bookingId: number) {
    await api.post(`/driver/bookings/${bookingId}/reject`);
    onMessage("Booking rejected. Passenger WhatsApp cancellation message has been logged and seats were released.");
    await refetch();
    onRideChanged();
  }

  if (isLoading) return <p className="text-sm text-muted">Loading bookings...</p>;
  if (!bookings?.length) return <p className="alert-info">No bookings on this ride yet.</p>;

  return (
    <div className="card overflow-hidden">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex flex-col gap-3 border-b border-sand-light px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{booking.passenger_name}</p>
            <p className="text-sm text-muted">
              {booking.booking_code} - {booking.seats_booked} seats - {booking.pickup_point} to {booking.drop_point}
            </p>
            <p className="text-sm text-muted">WhatsApp: {booking.passenger_whatsapp || "Not added"}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="chip self-start sm:self-end">
              {booking.status} - Rs. {booking.total_amount}
            </span>
            {booking.status === "pending" && (
              <div className="flex w-full gap-2 sm:w-auto">
                <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={() => acceptBooking(booking.id)}>
                  <CheckCircle2 size={16} />
                  Accept
                </button>
                <button type="button" className="btn-danger flex-1 sm:flex-none" onClick={() => rejectBooking(booking.id)}>
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyRides() {
  const [message, setMessage] = useState("");
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["my-rides"],
    queryFn: async () => (await api.get<Ride[]>("/driver/rides")).data
  });

  async function cancelRide(rideId: number) {
    await api.post(`/driver/rides/${rideId}/cancel`, { reason: "Driver cancelled from app" });
    setMessage("Ride cancelled. WhatsApp cancellation messages have been logged for booked passengers.");
    refetch();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="card-soft rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold">Published Rides</h1>
          <p className="mt-2 text-muted">Open any published ride to see all passengers who booked it.</p>
        </div>
        {message && <p className="alert-success">{message}</p>}
        {data?.map((ride) => (
          <div key={ride.id} className="flex flex-col gap-3">
            <RideCard
              ride={ride}
              actions={
                <>
                  <button
                    type="button"
                    className="btn-outline self-start"
                    onClick={() => setExpandedRideId((current) => (current === ride.id ? null : ride.id))}
                  >
                    {expandedRideId === ride.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {expandedRideId === ride.id ? "Hide booked passengers" : "View booked passengers"}
                  </button>
                  {ride.status !== "cancelled" && (
                    <button type="button" className="btn-danger self-start" onClick={() => cancelRide(ride.id)}>
                      <XCircle size={16} />
                      Cancel Ride
                    </button>
                  )}
                </>
              }
              details={
                expandedRideId === ride.id ? (
                  <RideBookings rideId={ride.id} onMessage={setMessage} onRideChanged={refetch} />
                ) : null
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
