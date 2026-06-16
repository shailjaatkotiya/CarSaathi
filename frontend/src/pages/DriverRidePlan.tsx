import { ArrowLeft, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { driverApi } from "../api/driver";
import { ridesApi } from "../api/rides";
import NavigationPanel from "../components/NavigationPanel";
import { queryKeys } from "../lib/queryKeys";

function TimelineStop({
  time,
  city,
  address,
  isLast
}: {
  time: string;
  city: string;
  address?: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="h-3 w-3 rounded-full border-2 border-primary bg-white mt-1 shrink-0" />
        {!isLast && <span className="flex-1 w-0.5 bg-gray-300 my-1" />}
      </div>
      <div className={`pb-4 min-w-0 ${isLast ? "" : ""}`}>
        <p className="text-base font-bold">{time ? <>{time} &nbsp; </> : null}{city}</p>
        {address && <p className="text-xs text-muted mt-0.5 leading-relaxed">{address}</p>}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long" });
}

export default function DriverRidePlan() {
  const { rideId } = useParams();
  const navigate = useNavigate();

  const { data: ride } = useQuery({
    queryKey: queryKeys.rides.detail(rideId ?? ""),
    queryFn: () => ridesApi.get(rideId!),
    enabled: Boolean(rideId)
  });

  const { data: bookings } = useQuery({
    queryKey: queryKeys.driver.rideBookings(rideId ?? ""),
    queryFn: () => driverApi.rideBookings(rideId!),
    enabled: Boolean(rideId)
  });

  const activeBookings = bookings?.filter((b) => b.status !== "rejected" && b.status !== "cancelled") ?? [];

  if (!ride) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <p className="alert-info">Loading ride plan...</p>
      </div>
    );
  }

  const departureTime = ride.departure_time.slice(0, 5);
  const pickupAddr = ride.pickup_points[0] ?? "";
  const dropAddr = ride.drop_points[0] ?? "";

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary hover:opacity-70">
          <ArrowLeft size={22} />
        </button>
        <button type="button" className="text-sm font-bold text-primary hover:underline">
          Get support
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Ride plan</h1>

      {/* Govt ID verification prompt */}
      {ride.driver_verified === false && (
        <Link
          to="/verify"
          className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-primary-soft p-3.5 mb-4"
        >
          <span className="text-primary mt-0.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-primary">Verify your Govt. ID</p>
            <p className="text-xs text-primary/80 mt-0.5">It's quick to do and inspires trust in your fellow travellers.</p>
          </div>
        </Link>
      )}

      {/* Date */}
      <p className="text-base font-bold mb-3">{formatDate(ride.journey_date)}</p>

      {/* Timeline */}
      <div className="mb-4">
        <TimelineStop
          time={departureTime}
          city={ride.source_city}
          address={pickupAddr}
        />
        <TimelineStop
          time=""
          city={ride.destination_city}
          address={dropAddr}
          isLast
        />
      </div>

      <NavigationPanel rideId={ride.id} pickupPoint={pickupAddr} dropPoint={dropAddr} />

      <div className="border-t border-sand my-4" />

      {/* Passengers */}
      {activeBookings.length === 0 ? (
        <p className="text-sm text-muted py-1">No passengers for this ride</p>
      ) : (
        <div className="flex items-center gap-2 py-1">
          <Users size={16} className="text-muted" />
          <p className="text-sm font-semibold">{activeBookings.length} passenger{activeBookings.length !== 1 ? "s" : ""}</p>
          <div className="flex flex-wrap gap-1 ml-1">
            {activeBookings.map((b) => (
              <span key={b.id} className="chip text-xs">{b.passenger_name} · {b.seats_booked} seat{b.seats_booked !== 1 ? "s" : ""}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-sand my-4" />

      {/* Links */}
      <div className="flex flex-col gap-0">
        <Link
          to={`/rides/${ride.id}`}
          className="flex items-center justify-between py-3.5 border-b border-sand hover:bg-sand-light px-1 transition"
        >
          <div>
            <p className="text-sm font-semibold">See your publication online</p>
            <p className="text-xs text-muted mt-0.5">No views yet</p>
          </div>
          <ArrowLeft size={16} className="rotate-180 text-muted" />
        </Link>
        <Link
          to={`/my-rides/${ride.id}/edit`}
          className="flex items-center justify-between py-3.5 hover:bg-sand-light px-1 transition"
        >
          <p className="text-sm font-semibold">Edit your publication</p>
          <ArrowLeft size={16} className="rotate-180 text-muted" />
        </Link>
      </div>
    </div>
  );
}
