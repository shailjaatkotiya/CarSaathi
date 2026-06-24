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
    <div className="card overflow-hidden p-3 md:p-4">
      <div className="flex flex-col gap-2 md:gap-3">
        <div className="flex items-start justify-between gap-2 md:gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
              <h3 className="text-sm font-bold leading-snug md:text-base">
                {ride.source_city} to {ride.destination_city}
              </h3>
              <StatusChip label={rideStateLabel(ride)} />
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold leading-none md:text-xl">
              Rs. {ride.price_per_seat}
            </p>
            <p className="text-[11px] text-muted">per seat</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink md:gap-x-4 md:gap-y-1.5 md:text-sm">
          <span className="flex items-center gap-1.5">
            <Calendar size={14} className="text-primary" />
            {formatShortDate(ride.journey_date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-primary" />
            {formatTimeAmPm(ride.departure_time)}
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Armchair size={14} />
            {ride.total_seats - ride.available_seats}/{ride.total_seats} seats booked
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Star size={14} />
            {ride.driver_rating || 4.5}
          </span>
        </div>

        {actions && (
          <div className="flex flex-wrap gap-1.5 border-t border-sand pt-2 md:gap-2 md:pt-3">
            {actions}
          </div>
        )}

        {details && <div>{details}</div>}
      </div>
    </div>
  );
}
