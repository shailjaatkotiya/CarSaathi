import { CheckCircle2, ChevronDown, ChevronUp, ClipboardList, MessageCircle, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { driverApi } from "../api/driver";
import { whatsappLink } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";
import type { DriverBooking, Ride } from "../types";
import RideCard from "./RideCard";

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
    queryKey: queryKeys.driver.rideBookings(rideId),
    queryFn: () => driverApi.rideBookings(rideId)
  });

  async function acceptBooking(bookingId: number) {
    await driverApi.acceptBooking(bookingId);
    onMessage("Booking accepted. Passenger confirmation WhatsApp has been logged.");
    await refetch();
    onRideChanged();
  }

  async function rejectBooking(bookingId: number) {
    await driverApi.rejectBooking(bookingId);
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
            {whatsappLink(booking.passenger_whatsapp) ? (
              <a
                href={whatsappLink(booking.passenger_whatsapp)!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                <MessageCircle size={14} />
                Chat on WhatsApp {booking.passenger_whatsapp}
              </a>
            ) : (
              <p className="text-sm text-muted">WhatsApp: Not added</p>
            )}
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

// Renders the driver's published rides with expandable booked-passenger lists.
// Used both on the standalone /my-rides page and inside the profile dropdown.
export default function PublishedRidesList() {
  const [message, setMessage] = useState("");
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const { data, refetch } = useQuery({
    queryKey: queryKeys.driver.rides,
    queryFn: driverApi.rides
  });

  async function cancelRide(rideId: number) {
    await driverApi.cancelRide(rideId);
    setMessage("Ride cancelled. WhatsApp cancellation messages have been logged for booked passengers.");
    refetch();
  }

  async function completeRide(rideId: number) {
    await driverApi.completeRide(rideId);
    setMessage("Ride marked completed. Passengers can now review or report it.");
    refetch();
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="alert-success">{message}</p>}
      {data?.map((ride) => (
        <div key={ride.id} className="flex flex-col gap-3">
          <RideCard
            ride={ride}
            actions={
              <>
                <Link to={`/my-rides/${ride.id}`} className="btn-outline self-start">
                  <ClipboardList size={16} />
                  Ride plan
                </Link>
                <button
                  type="button"
                  className="btn-outline self-start"
                  onClick={() => setExpandedRideId((current) => (current === ride.id ? null : ride.id))}
                >
                  {expandedRideId === ride.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandedRideId === ride.id ? "Hide passengers" : "View passengers"}
                </button>
                {ride.status !== "cancelled" && ride.status !== "completed" && (
                  <button type="button" className="btn-outline self-start" onClick={() => completeRide(ride.id)}>
                    <CheckCircle2 size={16} />
                    Mark completed
                  </button>
                )}
                {ride.status !== "cancelled" && ride.status !== "completed" && (
                  <button type="button" className="btn-danger self-start" onClick={() => cancelRide(ride.id)}>
                    <XCircle size={16} />
                    Cancel
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
      {data?.length === 0 && <p className="alert-info">No published rides yet.</p>}
    </div>
  );
}
