import { Armchair, Car, Clock, Fuel, MapPin, Route as RouteIcon, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Ride } from "../api/client";
import VerifiedBadge from "./VerifiedBadge";

function categoryIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("7")) return "7";
  if (normalized.includes("mini")) return "M";
  if (normalized.includes("suv")) return "SUV";
  return "SED";
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
              {ride.vehicle.brand} {ride.vehicle.model} · {ride.ac_available ? "AC" : "Non-AC"}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-2xl font-bold">Rs. {ride.price_per_seat}</p>
            <p className="text-xs text-muted">per seat</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="chip">
            <Car size={14} />
            {categoryIcon(ride.vehicle.car_type)} · {ride.vehicle.car_type}
          </span>
          <span className="chip-outline">
            <Fuel size={14} />
            {ride.vehicle.fuel_type}
          </span>
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

        <div className="flex flex-col gap-2 text-sm text-muted md:flex-row md:gap-5">
          <span className="flex items-center gap-2">
            <Clock size={16} />
            {ride.journey_date} at {ride.departure_time.slice(0, 5)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={16} />
            {ride.distance_km} km
          </span>
          {ride.route_stops.length > 0 && (
            <span className="flex items-center gap-2">
              <RouteIcon size={16} />
              {ride.route_stops.join(" → ")}
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

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-muted">Hosted by {ride.driver_name}</p>
          <Link to={`/rides/${ride.id}`} className="btn-primary">
            View ride
          </Link>
        </div>
      </div>
    </div>
  );
}
