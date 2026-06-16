import {
  Armchair,
  Calendar,
  Car,
  Clock,
  Fuel,
  Route as RouteIcon,
  Star,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatShortDate, formatTimeAmPm, ridePhase } from "../lib/format";
import type { Ride } from "../types";

// Driver-facing ride status: Pending (upcoming) -> On Going (departed, < 6h) ->
// Completed (>= 6h after departure, or marked/auto completed). Cancelled stays.
function driverRideStatus(ride: Ride): string {
  if (ride.status === "cancelled") return "Cancelled";
  if (ride.status === "completed") return "Completed";
  const phase = ridePhase(ride.journey_date, ride.departure_time);
  if (phase === "ended") return "Completed";
  if (phase === "ongoing") return "On Going";
  return "Pending";
}

export default function RideCard({
  ride,
  actions,
  details,
}: {
  ride: Ride;
  actions?: ReactNode;
  details?: ReactNode;
}) {
  const status = driverRideStatus(ride);
  return (
    <div className="card overflow-hidden p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold">
                {ride.source_city} to {ride.destination_city}
              </h3>
              <span
                className={status === "Cancelled" ? "chip-outline" : "chip"}
              >
                {status}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold leading-none">
              Rs. {ride.price_per_seat}
            </p>
            <p className="text-[11px] text-muted">per seat</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-bold text-ink">
          <span className="flex items-center gap-1.5">
            <Calendar size={15} className="text-primary" />
            {formatShortDate(ride.journey_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={15} className="text-primary" />
            {formatTimeAmPm(ride.departure_time)}
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Armchair size={15} />
            {ride.total_seats - ride.available_seats}/{ride.total_seats} seats booked
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Star size={15} />
            {ride.driver_rating || 4.5}
          </span>
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2 border-t border-sand pt-3">
            {actions}
          </div>
        )}

        {details && <div>{details}</div>}
      </div>
    </div>
  );
}
