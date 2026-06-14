import { Armchair, Calendar, Car, Clock, Fuel, MapPin, Route as RouteIcon, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Ride } from "../api/client";
import VerifiedBadge from "./VerifiedBadge";

function formatRideDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export default function RideCard({ ride, actions, details }: { ride: Ride; actions?: ReactNode; details?: ReactNode }) {
  return (
    <div className="card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold">
                {ride.source_city} to {ride.destination_city}
              </h3>
              <VerifiedBadge verified={ride.driver_verified} />
            </div>
            <p className="mt-1 text-muted">
              {ride.vehicle.brand} {ride.vehicle.model} - {ride.ac_available ? "AC" : "Non-AC"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold">Rs. {ride.price_per_seat}</p>
            <p className="text-xs text-muted">per seat</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="chip-outline">
            <Armchair size={14} />
            {ride.available_seats} remaining seats
          </span>
          <span className="chip-outline">
            <Star size={14} />
            {ride.driver_rating || 4.5} rating
          </span>
        </div>

        <hr className="border-sand" />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-lg font-bold text-ink">
          <span className="flex items-center gap-2">
            <Calendar size={18} className="text-primary" />
            {formatRideDate(ride.journey_date)}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            {ride.departure_time.slice(0, 5)}
          </span>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted md:flex-row md:flex-wrap md:gap-5">
          <span className="flex items-center gap-2">
            <MapPin size={16} />
            {ride.distance_km} km
          </span>
          {ride.route_stops.length > 0 && (
            <span className="flex items-center gap-2">
              <RouteIcon size={16} />
              {ride.route_stops.join(" -> ")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {ride.pickup_points.slice(0, 4).map((point) => (
            <span key={point} className="rounded-full bg-sand-light px-3 py-1 text-xs font-semibold text-ink">
              {point}
            </span>
          ))}
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2 border-t border-sand pt-4">
            {actions}
          </div>
        )}

        {details && <div>{details}</div>}

        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-muted">Hosted by {ride.driver_name}</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-light px-2.5 py-1 text-[11px] font-bold text-muted">
                <Car size={12} />
                {ride.vehicle.car_type}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-light px-2.5 py-1 text-[11px] font-bold text-muted">
                <Fuel size={12} />
                {ride.vehicle.fuel_type}
              </span>
            </div>
          </div>
          <Link to={`/rides/${ride.id}`} className="btn-primary">
            View ride
          </Link>
        </div>
      </div>
    </div>
  );
}
