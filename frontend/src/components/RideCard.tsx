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
import { formatShortDate, formatTimeAmPm } from "../lib/format";
import { rideStateLabel } from "../lib/rideStatus";
import StatusChip from "./StatusChip";
import type { Ride } from "../types";

export default function RideCard({
  ride,
  actions,
  details,
}: {
  ride: Ride;
  actions?: ReactNode;
  details?: ReactNode;
}) {
  return (
    <div className="card overflow-hidden p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold">
                {ride.source_city} to {ride.destination_city}
              </h3>
              <StatusChip label={rideStateLabel(ride)} />
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
