import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Edit3,
  Eye,
  MessageCircle,
  Repeat2,
  X,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, Ride, whatsappLink } from "../api/client";
import RideCard from "./RideCard";

type RideBooking = {
  id: number;
  booking_code: string;
  passenger_id: number;
  passenger_name: string;
  passenger_whatsapp?: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

function RideBookings({
  rideId,
  onMessage,
  onRideChanged
}: {
  rideId: number;
  onMessage: (message: string) => void;
  onRideChanged: () => void;
}) {
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ["ride-bookings", rideId],
    queryFn: async () => (await api.get<RideBooking[]>(`/driver/rides/${rideId}/bookings`)).data
  });

  async function acceptBooking(bookingId: number) {
    await api.post(`/driver/bookings/${bookingId}/accept`);
    onMessage("Booking accepted. Passenger confirmation WhatsApp has been logged.");
    await refetch();
    onRideChanged();
  }

  async function rejectBooking(bookingId: number) {
    await api.post(`/driver/bookings/${bookingId}/reject`);
    onMessage("Booking rejected. Passenger WhatsApp cancellation message has been logged and seats were released.");
    await refetch();
    onRideChanged();
  }

  if (isLoading) return <p className="text-sm text-muted">Loading bookings...</p>;
  if (!bookings?.length) return <p className="alert-info">No bookings on this ride yet.</p>;

  return (
    <div className="card overflow-hidden">
      {bookings.map((booking) => (
        <div key={booking.id} className="flex flex-col gap-3 border-b border-sand-light px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">{booking.passenger_name}</p>
            <p className="text-sm text-muted">
              {booking.booking_code} - {booking.seats_booked} seats - {booking.pickup_point} to {booking.drop_point}
            </p>
            {whatsappLink(booking.passenger_whatsapp) ? (
              <a
                href={whatsappLink(booking.passenger_whatsapp)!}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
              >
                <MessageCircle size={14} />
                Chat on WhatsApp {booking.passenger_whatsapp}
              </a>
            ) : (
              <p className="text-sm text-muted">WhatsApp: Not added</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="chip self-start sm:self-end">
              {booking.status} - Rs. {booking.total_amount}
            </span>
            {booking.status === "pending" && (
              <div className="flex w-full gap-2 sm:w-auto">
                <button type="button" className="btn-primary flex-1 sm:flex-none" onClick={() => acceptBooking(booking.id)}>
                  <CheckCircle2 size={16} />
                  Accept
                </button>
                <button type="button" className="btn-danger flex-1 sm:flex-none" onClick={() => rejectBooking(booking.id)}>
                  <XCircle size={16} />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Renders the driver's published rides with expandable booked-passenger lists.
// Used both on the standalone /my-rides page and inside the profile dropdown.
export default function PublishedRidesList() {
  const [message, setMessage] = useState("");
  const [expandedRideId, setExpandedRideId] = useState<number | null>(null);
  const [manageRideId, setManageRideId] = useState<number | null>(null);
  const [cancelRideId, setCancelRideId] = useState<number | null>(null);
  const { data, refetch } = useQuery({
    queryKey: ["my-rides"],
    queryFn: async () => (await api.get<Ride[]>("/driver/rides")).data
  });

  async function cancelRide(rideId: number) {
    await api.post(`/driver/rides/${rideId}/cancel`, { reason: "Driver cancelled from app" });
    setMessage("Ride cancelled. WhatsApp cancellation messages have been logged for booked passengers.");
    setCancelRideId(null);
    setManageRideId(null);
    refetch();
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="alert-success">{message}</p>}
      {cancelRideId && (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-2xl bg-primary p-5 text-white shadow-soft">
            <AlertTriangle size={46} className="text-white" />
            <h2 className="mt-5 text-2xl font-black leading-tight">
              You're about to cancel your ride. It will be deleted and passengers won't be able to travel with you.
            </h2>
            <div className="mt-10 flex items-center justify-between gap-3">
              <button type="button" className="grid h-14 w-14 place-items-center rounded-full bg-white text-primary" onClick={() => setCancelRideId(null)}>
                <X size={22} />
              </button>
              <button type="button" className="btn-danger border-white/20 bg-white text-primary hover:bg-sand-light" onClick={() => cancelRide(cancelRideId)}>
                Cancel the ride
              </button>
            </div>
          </div>
        </div>
      )}
      {data?.map((ride) => (
        <div key={ride.id} className="flex flex-col gap-3">
          <RideCard
            ride={ride}
            actions={
              <>
                <button
                  type="button"
                  className="btn-outline self-start"
                  onClick={() => setManageRideId((current) => (current === ride.id ? null : ride.id))}
                >
                  {manageRideId === ride.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {manageRideId === ride.id ? "Hide publication" : "Manage publication"}
                </button>
                <button
                  type="button"
                  className="btn-outline self-start"
                  onClick={() => setExpandedRideId((current) => (current === ride.id ? null : ride.id))}
                >
                  {expandedRideId === ride.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandedRideId === ride.id ? "Hide booked passengers" : "View booked passengers"}
                </button>
                {ride.status !== "cancelled" && (
                  <button type="button" className="btn-danger self-start" onClick={() => setCancelRideId(ride.id)}>
                    <XCircle size={16} />
                    Cancel Ride
                  </button>
                )}
              </>
            }
            details={
              <>
                {manageRideId === ride.id && (
                  <div className="rounded-2xl border border-sand bg-white p-4">
                    <h3 className="text-lg font-black">Your publication</h3>
                    <div className="mt-3 divide-y divide-sand">
                      <Link to={`/rides/${ride.id}`} className="flex items-center gap-3 py-3 font-bold">
                        <Eye size={18} className="text-muted" />
                        <span>
                          <span className="block">See your publication online</span>
                          <span className="block text-sm font-semibold text-muted">
                            {ride.available_seats} seats left
                          </span>
                        </span>
                        <ChevronRight size={18} className="ml-auto text-muted" />
                      </Link>
                      <Link to="/driver/create-ride" className="flex items-center gap-3 py-3 font-bold">
                        <Edit3 size={18} className="text-muted" />
                        Edit your publication
                        <ChevronRight size={18} className="ml-auto text-muted" />
                      </Link>
                      <Link to="/driver/create-ride" className="flex items-center gap-3 py-3 font-bold text-primary">
                        <Copy size={18} />
                        Duplicate your publication
                      </Link>
                      <Link to="/driver/create-ride" className="flex items-center gap-3 py-3 font-bold text-primary">
                        <Repeat2 size={18} />
                        Publish your return ride
                      </Link>
                      {ride.status !== "cancelled" && (
                        <button type="button" className="flex w-full items-center gap-3 py-3 text-left font-bold text-primary" onClick={() => setCancelRideId(ride.id)}>
                          <XCircle size={18} />
                          Cancel your ride
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {expandedRideId === ride.id && <RideBookings rideId={ride.id} onMessage={setMessage} onRideChanged={refetch} />}
              </>
            }
          />
        </div>
      ))}
      {data?.length === 0 && (
        <div className="card p-5 text-center">
          <p className="font-black">No published rides yet.</p>
          <Link to="/driver/create-ride" className="btn-primary mt-4">
            Publish a ride
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
