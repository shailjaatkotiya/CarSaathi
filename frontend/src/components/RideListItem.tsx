import { Armchair, Car, Fuel, Route as RouteIcon, Snowflake, Star, UserRound, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ride } from "../types";
import { formatTimeAmPm } from "../lib/format";
import VerifiedBadge from "./VerifiedBadge";

export default function RideListItem({ ride }: { ride: Ride }) {
  const full = ride.available_seats <= 0;

  return (
    <Link
      to={`/rides/${ride.id}`}
      className={`card block p-4 transition hover:border-primary hover:shadow-soft ${full ? "opacity-60" : ""}`}
    >
      <div className="flex items-stretch justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="shrink-0 text-lg font-bold leading-none tabular-nums">{formatTimeAmPm(ride.departure_time)}</span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary" />
            <span className="relative h-px flex-1 bg-sand">
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-1.5 text-[11px] font-bold text-muted">
                {ride.distance_km} km
              </span>
            </span>
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-3 text-sm font-bold text-ink">
            <span className="truncate">{ride.source_city}</span>
            <span className="truncate text-right">{ride.destination_city}</span>
          </div>

          {ride.route_stops.length > 0 && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
              <RouteIcon size={13} className="shrink-0" />
              {ride.route_stops.join(" -> ")}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 font-bold text-ink">
              <Car size={14} />
              {ride.driver_name}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star size={13} />
              {ride.driver_rating || 4.5}
            </span>
            {ride.driver_verified && <VerifiedBadge verified />}
            {ride.auto_confirm_bookings && (
              <span className="inline-flex items-center gap-1 font-bold text-primary">
                <Zap size={13} />
                Instant
              </span>
            )}
            {ride.women_only_preference && (
              <span className="inline-flex items-center gap-1 font-bold text-pink-600">
                <UserRound size={13} />
                Women only
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Armchair size={13} />
              {ride.available_seats} seats
            </span>
            {ride.ac_available && (
              <span className="inline-flex items-center gap-1">
                <Snowflake size={13} />
                AC
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Fuel size={13} />
              {ride.vehicle.fuel_type}
            </span>
            <span>{ride.vehicle.car_type}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center border-l border-sand pl-4">
          {full ? (
            <span className="text-lg font-bold text-muted">Full</span>
          ) : (
            <>
              <span className="text-xl font-bold leading-none">Rs. {ride.price_per_seat}</span>
              <span className="mt-1 text-[11px] text-muted">per seat</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
