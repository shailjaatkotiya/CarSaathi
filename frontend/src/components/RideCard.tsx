import { Armchair, Calendar, Car, Clock, Fuel, MapPin, Route as RouteIcon, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatShortDate, formatTimeAmPm } from "../lib/format";
import type { Ride } from "../types";
import VerifiedBadge from "./VerifiedBadge";

export default function RideCard({ ride, actions, details }: { ride: Ride; actions?: ReactNode; details?: ReactNode }) {
  return (
    <div className="card overflow-hidden p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold">
                {ride.source_city} to {ride.destination_city}
              </h3>
              <VerifiedBadge verified={ride.driver_verified} />
            </div>
            <p className="mt-0.5 text-sm text-muted">
              {ride.vehicle.brand} {ride.vehicle.model} - {ride.ac_available ? "AC" : "Non-AC"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl font-bold leading-none">Rs. {ride.price_per_seat}</p>
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
            {ride.available_seats} seats
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <Star size={15} />
            {ride.driver_rating || 4.5}
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <MapPin size={15} />
            {ride.distance_km} km
          </span>
        </div>

        {(ride.route_stops.length > 0 || ride.pickup_points.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {ride.route_stops.length > 0 && (
              <span className="flex items-center gap-1.5">
                <RouteIcon size={14} />
                {ride.route_stops.join(" -> ")}
              </span>
            )}
            {ride.pickup_points.length > 0 && (
              <span className="truncate">Pickup: {ride.pickup_points.slice(0, 4).join(", ")}</span>
            )}
          </div>
        )}

        {actions && <div className="flex flex-wrap gap-2 border-t border-sand pt-3">{actions}</div>}

        {details && <div>{details}</div>}

        <div className="flex items-center justify-between gap-3 border-t border-sand pt-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="font-bold">{ride.driver_name}</span>
            <span className="inline-flex items-center gap-1">
              <Car size={12} />
              {ride.vehicle.car_type}
            </span>
            <span className="inline-flex items-center gap-1">
              <Fuel size={12} />
              {ride.vehicle.fuel_type}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-ink">{ride.vehicle.vehicle_number}</span>
          </div>
          <Link to={`/rides/${ride.id}`} className="btn-primary shrink-0 min-h-[36px] px-4 py-1.5">
            View ride
          </Link>
        </div>
      </div>
    </div>
  );
}
