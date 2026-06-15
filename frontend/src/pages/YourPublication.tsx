import { ArrowLeft, Banknote, Map, Route, Users, Zap } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { driverApi } from "../api/driver";
import { ridesApi } from "../api/rides";
import { queryKeys } from "../lib/queryKeys";

type MenuItem = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
};

export default function YourPublication() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: ride } = useQuery({
    queryKey: queryKeys.rides.detail(rideId ?? ""),
    queryFn: () => ridesApi.get(rideId!),
    enabled: Boolean(rideId)
  });

  const cancelRide = useMutation({
    mutationFn: () => driverApi.cancelRide(Number(rideId)),
    onSuccess: () => {
      setMessage("Ride cancelled successfully.");
      setConfirmCancel(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.driver.rides });
      queryClient.invalidateQueries({ queryKey: queryKeys.rides.detail(rideId ?? "") });
    },
    onError: (err) => {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not cancel the ride.");
    }
  });

  if (!ride) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <p className="alert-info">Loading...</p>
      </div>
    );
  }

  const paymentLabel = "Passengers will pay in cash.";

  const menuItems: MenuItem[] = [
    {
      icon: <Route size={18} className="text-muted" />,
      label: "Itinerary details",
      sublabel: `${ride.source_city} → ${ride.destination_city} · ${ride.journey_date}`
    },
    {
      icon: <Map size={18} className="text-muted" />,
      label: "Route Map"
    },
    {
      icon: <Banknote size={18} className="text-muted" />,
      label: "Price",
      sublabel: paymentLabel
    },
    {
      icon: <Users size={18} className="text-muted" />,
      label: "Seats and options",
      sublabel: `${ride.available_seats} seat${ride.available_seats !== 1 ? "s" : ""} available${ride.women_only_preference ? " · Women only" : ""}${ride.auto_confirm_bookings ? " · Instant booking" : ""}`
    },
    {
      icon: <Zap size={18} className="text-muted" />,
      label: "Boost booking requests"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4">
      {/* Header */}
      <button type="button" onClick={() => navigate(-1)} className="p-1 -ml-1 text-primary hover:opacity-70 mb-4">
        <ArrowLeft size={22} />
      </button>

      <h1 className="text-2xl font-bold mb-6">Your publication</h1>

      {message && <p className="alert-success mb-4">{message}</p>}
      {error && <p className="alert-error mb-4">{error}</p>}

      {/* Menu rows */}
      <div className="card overflow-hidden divide-y divide-sand-light mb-4">
        {menuItems.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {}}
            className="flex items-center gap-3 w-full px-4 py-4 text-left hover:bg-sand-light transition"
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold">{item.label}</span>
              {item.sublabel && <span className="block text-xs text-muted mt-0.5">{item.sublabel}</span>}
            </span>
            <ArrowLeft size={16} className="rotate-180 text-muted shrink-0" />
          </button>
        ))}
      </div>

      <div className="border-t border-sand my-4" />

      {/* Action links */}
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => {}}
          className="text-left px-1 py-2 text-sm font-bold text-primary hover:underline"
        >
          Duplicate your publication
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="text-left px-1 py-2 text-sm font-bold text-primary hover:underline"
        >
          Publish your return ride
        </button>
        {ride.status !== "cancelled" && (
          <>
            {confirmCancel ? (
              <div className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                <p className="text-sm font-semibold text-red-700">Cancel this ride? This will notify all passengers.</p>
                <div className="flex gap-2">
                  <button type="button" className="btn-outline flex-1 text-sm" onClick={() => setConfirmCancel(false)}>Keep ride</button>
                  <button
                    type="button"
                    className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 transition"
                    onClick={() => cancelRide.mutate()}
                    disabled={cancelRide.isPending}
                  >
                    {cancelRide.isPending ? "Cancelling..." : "Yes, cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="text-left px-1 py-2 text-sm font-bold text-primary hover:underline"
              >
                Cancel your ride
              </button>
            )}
          </>
        )}
        {ride.status === "cancelled" && (
          <p className="px-1 py-2 text-sm text-red-600 font-semibold">This ride is cancelled.</p>
        )}
      </div>
    </div>
  );
}
