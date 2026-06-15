import { Armchair, Car, ChevronRight, Fuel, Route as RouteIcon, ShieldCheck, Snowflake, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Ride } from "../api/client";

export default function RideListItem({ ride }: { ride: Ride }) {
  const full = ride.available_seats <= 0;

  return (
    <Link
      to={`/rides/${ride.id}`}
      className={`block overflow-hidden rounded-2xl border border-sand bg-white transition hover:border-primary hover:shadow-soft ${full ? "opacity-60" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-[64px_22px_1fr] gap-x-2 gap-y-1">
            <span className="text-lg font-black tabular-nums">{ride.departure_time.slice(0, 5)}</span>
            <span className="mt-1 h-3 w-3 rounded-full border-2 border-primary bg-white" />
            <span className="text-xl font-black leading-tight">{ride.source_city}</span>
            <span className="text-xs font-bold text-muted">{Math.max(1, Math.round(ride.distance_km / 70))}h</span>
            <span className="mx-[5px] h-11 w-0.5 rounded-full bg-muted" />
            <span className="text-xs text-muted">{ride.pickup_points[0] || "Pickup point shared after booking"}</span>
            <span className="text-lg font-black tabular-nums">
              {ride.departure_time.slice(0, 2)}:{String((Number(ride.departure_time.slice(3, 5)) + 50) % 60).padStart(2, "0")}
            </span>
            <span className="mt-1 h-3 w-3 rounded-full border-2 border-muted bg-white" />
            <span className="text-xl font-black leading-tight">{ride.destination_city}</span>
          </div>
          <div className="shrink-0 text-right">
            {full ? (
              <span className="text-lg font-black text-muted">Full</span>
            ) : (
              <>
                <span className="text-2xl font-black leading-none">Rs. {ride.price_per_seat}</span>
                <span className="mt-1 block text-xs text-muted">per seat</span>
              </>
            )}
          </div>
        </div>
      </div>
      {ride.route_stops.length > 0 && (
        <p className="border-t border-sand px-4 py-2 text-xs font-semibold text-muted">
          <RouteIcon size={13} className="mr-1 inline" />
          Stops: {ride.route_stops.join(" -> ")}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-sand px-4 py-3 text-xs text-muted">
        <span className="inline-flex items-center gap-2 font-black text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">{ride.driver_name.slice(0, 1)}</span>
          {ride.driver_name}
        </span>
        <span className="inline-flex items-center gap-1">
          <Star size={13} />
          {ride.driver_rating || 4.5}
        </span>
        {ride.driver_verified && (
          <span className="inline-flex items-center gap-1 font-bold text-primary">
            <ShieldCheck size={13} />
            Verified
          </span>
        )}
        {ride.auto_confirm_bookings && (
          <span className="inline-flex items-center gap-1 font-bold text-primary">
            <Zap size={13} />
            Instant
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
        <span className="inline-flex items-center gap-1">
          <Car size={13} />
          {ride.vehicle.car_type}
        </span>
        <ChevronRight size={18} className="ml-auto text-muted" />
      </div>
    </Link>
  );
}
