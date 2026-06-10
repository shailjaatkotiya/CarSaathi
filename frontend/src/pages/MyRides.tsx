import { ChevronDown, ChevronUp, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";

type RideBooking = {
  id: number;
  booking_code: string;
  passenger_id: number;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

function RideBookings({ rideId }: { rideId: number }) {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["ride-bookings", rideId],
    queryFn: async () => (await api.get<RideBooking[]>(`/driver/rides/${rideId}/bookings`)).data
  });

  if (isLoading) return <p className="text-sm text-muted">Loading bookings...</p>;
  if (!bookings?.length) return <p className="alert-info">No bookings on this ride yet.</p>;

  return (
    <div className="card overflow-hidden">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex flex-col gap-1 border-b border-sand-light px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{booking.booking_code}</p>
            <p className="text-sm text-muted">
              {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
            </p>
          </div>
          <span className="chip self-start sm:self-center">
            {booking.status} · Rs. {booking.total_amount}
          </span>
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">Driver - My rides</h1>
        {message && <p className="alert-success">{message}</p>}
        {data?.map((ride) => (
          <div key={ride.id} className="flex flex-col gap-3">
            <RideCard ride={ride} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-outline self-start"
                onClick={() => setExpandedRideId((current) => (current === ride.id ? null : ride.id))}
              >
                {expandedRideId === ride.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {expandedRideId === ride.id ? "Hide bookings" : "View bookings"}
              </button>
              {ride.status !== "cancelled" && (
                <button type="button" className="btn-danger self-start" onClick={() => cancelRide(ride.id)}>
                  <XCircle size={16} />
                  Cancel ride and notify passengers on WhatsApp
                </button>
              )}
            </div>
            {expandedRideId === ride.id && <RideBookings rideId={ride.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
