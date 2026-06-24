import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { driverApi } from "../api/driver";
import { bookingStatusLabel } from "../constants/booking";
import { whatsappLink, rideChatPretext, rideStartMs, rideTimePassed } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";
import { rideStateLabel, type RideStateLabel } from "../lib/rideStatus";
import type { DriverBooking, Ride } from "../types";
import RideCard from "./RideCard";

function RideBookings({
  rideId,
  onMessage,
  onRideChanged,
}: {
  rideId: number;
  onMessage: (message: string) => void;
  onRideChanged: () => void;
}) {
  const {
    data: bookings,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKeys.driver.rideBookings(rideId),
    queryFn: () => driverApi.rideBookings(rideId),
  });

  async function acceptBooking(bookingId: number) {
    await driverApi.acceptBooking(bookingId);
    onMessage(
      "Booking accepted. Passenger confirmation WhatsApp has been logged.",
    );
    await refetch();
    onRideChanged();
  }

  async function rejectBooking(bookingId: number) {
    await driverApi.rejectBooking(bookingId);
    onMessage(
      "Booking rejected. Passenger WhatsApp cancellation message has been logged and seats were released.",
    );
    await refetch();
    onRideChanged();
  }

  if (isLoading)
    return <p className="text-xs text-muted md:text-sm">Loading bookings...</p>;
  if (!bookings?.length)
    return <p className="alert-info">No bookings on this ride yet.</p>;

  return (
    <div className="card overflow-hidden">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="flex flex-col gap-2 border-b border-sand-light px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between md:gap-3 md:px-4 md:py-3"
        >
          <div>
            <p className="text-sm font-semibold md:text-base">{booking.passenger_name}</p>
            <p className="text-xs text-muted md:text-sm">
              {booking.booking_code} - {booking.seats_booked} seats -{" "}
              {booking.pickup_point} to {booking.drop_point}
            </p>
            {booking.passengers && booking.passengers.length > 0 && (
              <p className="line-clamp-1 text-xs text-muted md:text-sm">
                Passengers:{" "}
                {booking.passengers
                  .map((p) => (p.age != null ? `${p.full_name} (${p.age})` : p.full_name))
                  .join(", ")}
              </p>
            )}
            {whatsappLink(booking.passenger_whatsapp) ? (
              <a
                href={
                  whatsappLink(
                    booking.passenger_whatsapp,
                    rideChatPretext(booking),
                  )!
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline md:text-sm"
              >
                <MessageCircle size={14} />
                Chat on WhatsApp {booking.passenger_whatsapp}
              </a>
            ) : (
              <p className="text-xs text-muted md:text-sm">WhatsApp: Not added</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5 sm:items-end md:gap-2">
            <span className="chip self-start sm:self-end">
              {bookingStatusLabel(booking.status)} - Rs. {booking.total_amount}
            </span>
            {booking.status === "pending" && (
              <div className="flex w-full gap-1.5 sm:w-auto md:gap-2">
                <button
                  type="button"
                  className="btn-primary min-h-[32px] flex-1 px-3 py-1 text-xs sm:flex-none md:min-h-[36px] md:text-sm"
                  onClick={() => acceptBooking(booking.id)}
                >
                  <CheckCircle2 size={14} />
                  Accept
                </button>
                <button
                  type="button"
                  className="btn-danger min-h-[32px] flex-1 px-3 py-1 text-xs sm:flex-none md:min-h-[36px] md:text-sm"
                  onClick={() => rejectBooking(booking.id)}
                >
                  <XCircle size={14} />
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
const DRIVER_FILTERS: { value: "all" | RideStateLabel; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

export default function PublishedRidesList() {
  const [message, setMessage] = useState("");
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  // Default to Pending; completed/cancelled show only when explicitly filtered.
  const [filter, setFilter] = useState<"all" | RideStateLabel>("Pending");
  const { data, refetch } = useQuery({
    queryKey: queryKeys.driver.rides,
    queryFn: driverApi.rides,
  });

  const filteredRides = data
    ?.filter((ride) => filter === "all" || rideStateLabel(ride) === filter)
    // Most upcoming ride first.
    .sort(
      (a, b) =>
        rideStartMs(a.journey_date, a.departure_time) -
        rideStartMs(b.journey_date, b.departure_time),
    );

  async function cancelRide(rideId: number) {
    await driverApi.cancelRide(rideId);
    setMessage(
      "Ride cancelled. WhatsApp cancellation messages have been logged for booked passengers.",
    );
    refetch();
  }

  return (
    <div className="flex flex-col gap-2.5 md:gap-3">
      {message && <p className="alert-success">{message}</p>}
      {data && data.length > 0 && (
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {DRIVER_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                filter === option.value
                  ? "chip-solid"
                  : "chip-outline hover:bg-sand-light"
              }
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {filteredRides?.map((ride) => {
        const passed = rideTimePassed(ride.journey_date, ride.departure_time);
        return (
          <div key={ride.id} className="flex flex-col gap-2.5 md:gap-3">
            <RideCard
              ride={ride}
              actions={
                <>
                  <button
                    type="button"
                    className="btn-outline min-h-[32px] self-start px-3 py-1 text-xs md:min-h-[36px] md:text-sm"
                    onClick={() =>
                      setExpandedRideId((current) =>
                        current === ride.id ? null : ride.id,
                      )
                    }
                  >
                    {expandedRideId === ride.id ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                    {expandedRideId === ride.id
                      ? "Hide passengers"
                      : "View passengers"}
                  </button>
                  {/* Cancel is removed once the departure has passed or the ride is
                    cancelled; disabled (but visible) for a manually-completed ride. */}
                  {ride.status !== "cancelled" && !passed && (
                    <button
                      type="button"
                      className="btn-danger min-h-[32px] self-start px-3 py-1 text-xs md:min-h-[36px] md:text-sm"
                      onClick={() => cancelRide(ride.id)}
                      disabled={ride.status === "completed"}
                    >
                      <XCircle size={14} />
                      Cancel
                    </button>
                  )}
                  <Link
                    to={`/rides/${ride.id}?view=1`}
                    className="btn-primary min-h-[32px] shrink-0 px-3 py-1 text-xs md:min-h-[36px] md:px-4 md:py-1.5 md:text-sm"
                  >
                    View ride
                  </Link>
                </>
              }
              details={
                expandedRideId === ride.id ? (
                  <RideBookings
                    rideId={ride.id}
                    onMessage={setMessage}
                    onRideChanged={refetch}
                  />
                ) : null
              }
            />
          </div>
        );
      })}
      {data?.length === 0 && (
        <p className="alert-info">No published rides yet.</p>
      )}
      {data && data.length > 0 && filteredRides?.length === 0 && (
        <p className="alert-info">No published rides match this filter.</p>
      )}
    </div>
  );
}
