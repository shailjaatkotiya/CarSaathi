import {
  Calendar,
  Car,
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  Palette,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { bookingsApi } from "../api/bookings";
import { apiErrorMessage } from "../lib/apiError";
import { whatsappLink, formatShortDate, formatTimeAmPm, rideChatPretext, rideTimePassed, ridePhase } from "../lib/format";
import AutoGrowTextarea from "./AutoGrowTextarea";
import { queryKeys } from "../lib/queryKeys";
import { CANCELLABLE_BOOKING_STATUSES } from "../constants/booking";
import type { Booking, BookingStatus } from "../types";

// Passenger-facing booking status: Pending / Accepted / Rejected / Cancelled /
// On Going / Completed. Open bookings (pending, confirmed) shift to On Going
// once the ride departs and Completed once it ends (6h after departure).
function passengerBookingStatus(booking: Booking): string {
  if (booking.status === "cancelled") return "Cancelled";
  if (booking.status === "rejected") return "Rejected";
  if (booking.status === "completed") return "Completed";
  const phase = ridePhase(booking.journey_date, booking.departure_time);
  if (phase === "ended") return "Completed";
  if (phase === "ongoing") return "On Going";
  return booking.status === "confirmed" ? "Accepted" : "Pending";
}

function ReportForm({
  booking,
  onDone,
}: {
  booking: Booking;
  onDone: (message: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function submitReport() {
    setError("");
    if (!reason.trim()) {
      setError("Please describe the issue before submitting the report.");
      return;
    }
    try {
      await bookingsApi.report({
        reported_user_id: booking.driver_id,
        ride_id: booking.ride_id,
        reason: reason.trim(),
      });
      onDone("Report submitted. Our admin team will review it.");
    } catch (err) {
      setError(
        apiErrorMessage(err, "Could not submit the report. Please try again."),
      );
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
      <p className="font-bold">Report driver {booking.driver_name}</p>
      <AutoGrowTextarea
        className="input mt-3"
        placeholder="Describe what went wrong"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      {error && <p className="alert-error mt-2">{error}</p>}
      <button type="button" className="btn-danger mt-3" onClick={submitReport}>
        Submit report
      </button>
    </div>
  );
}

// Renders the passenger's not-yet-completed booked rides. Used both on the
// standalone /profile/passenger page and inside the profile dropdown menu.
export default function BookedRidesList() {
  const [message, setMessage] = useState("");
  const [reportBookingId, setReportBookingId] = useState<number | null>(null);
  const { data: passengerBookings, refetch } = useQuery({
    queryKey: queryKeys.passenger.bookings,
    queryFn: bookingsApi.list,
  });

  async function cancelBooking(bookingId: number) {
    await bookingsApi.cancel(bookingId, "Passenger cancelled from profile");
    setMessage(
      "Booking cancelled. WhatsApp cancellation message has been logged.",
    );
    refetch();
  }

  function handleFormDone(text: string) {
    setMessage(text);
    setReportBookingId(null);
    refetch();
  }

  return (
    <div className="flex flex-col gap-3">
      {message && <p className="alert-success">{message}</p>}

      {passengerBookings?.map((booking) => (
        <div key={booking.id} className="card p-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-primary" />
                <h3 className="font-bold">
                  {booking.route.replace(/\s+to\s+/i, " -> ")}
                </h3>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar size={15} className="text-primary" />
                  {formatShortDate(booking.journey_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} className="text-primary" />
                  {formatTimeAmPm(booking.departure_time)}
                </span>
                {booking.car_number && (
                  <span className="flex items-center gap-1.5">
                    <Car size={15} className="text-primary" />
                    {booking.car_number}
                  </span>
                )}
                {booking.car_color && (
                  <span className="flex items-center gap-1.5">
                    <Palette size={15} className="text-primary" />
                    {booking.car_color}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted"></div>
              <p className="mt-2 text-sm text-muted">
                {booking.seats_booked} seats - {booking.pickup_point} to{" "}
                {booking.drop_point}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="chip">
                  {passengerBookingStatus(booking)}
                </span>
                <span className="chip-outline">{booking.booking_code}</span>
                <span className="chip-outline">Rs. {booking.total_amount}</span>
                {whatsappLink(booking.driver_whatsapp) && (
                  <a
                    href={whatsappLink(booking.driver_whatsapp, rideChatPretext(booking))!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip-solid hover:opacity-90"
                  >
                    <MessageCircle size={14} />
                    Chat with {booking.driver_name} {booking.driver_whatsapp}
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {/* Cancel while waiting for approval (pending) or after it is
                  confirmed - but never once the ride's departure has passed. */}
              {CANCELLABLE_BOOKING_STATUSES.includes(
                booking.status as BookingStatus,
              ) &&
                !rideTimePassed(booking.journey_date, booking.departure_time) && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => cancelBooking(booking.id)}
                >
                  <XCircle size={16} />
                  Cancel
                </button>
              )}
              {/* Report only after the ride is completed. */}
              {booking.status === "completed" && (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() =>
                    setReportBookingId((current) =>
                      current === booking.id ? null : booking.id,
                    )
                  }
                >
                  <Flag size={16} />
                  Report driver
                </button>
              )}
            </div>
          </div>
          {reportBookingId === booking.id && (
            <ReportForm booking={booking} onDone={handleFormDone} />
          )}
        </div>
      ))}

      {passengerBookings?.length === 0 && (
        <p className="alert-info">No unfinished booked rides yet.</p>
      )}
    </div>
  );
}
