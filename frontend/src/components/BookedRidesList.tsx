import {
  Calendar,
  Car,
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  Star,
  XCircle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { bookingsApi } from "../api/bookings";
import { apiErrorMessage } from "../lib/apiError";
import { whatsappLink, formatShortDate, formatTimeAmPm, rideChatPretext, rideStartMs, rideTimePassed } from "../lib/format";
import { passengerStateLabel, type PassengerStateLabel } from "../lib/rideStatus";
import AutoGrowTextarea from "./AutoGrowTextarea";
import StatusChip from "./StatusChip";
import { queryKeys } from "../lib/queryKeys";
import { CANCELLABLE_BOOKING_STATUSES } from "../constants/booking";
import type { Booking, BookingStatus } from "../types";

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
    <div className="mt-3 rounded-xl border border-sand bg-cream p-3 md:mt-4 md:p-4">
      <p className="font-bold">Report driver {booking.driver_name}</p>
      <AutoGrowTextarea
        className="input mt-3"
        placeholder="Describe what went wrong"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      {error && <p className="alert-error mt-2">{error}</p>}
      <button type="button" className="btn-danger mt-3 md:min-h-[36px]" onClick={submitReport}>
        Submit report
      </button>
    </div>
  );
}

function ReviewForm({
  booking,
  onDone,
}: {
  booking: Booking;
  onDone: (message: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReview() {
    setError("");
    setSubmitting(true);
    try {
      await bookingsApi.review(booking.id, {
        rating,
        comment: comment.trim() || null,
      });
      onDone("Review submitted. Thanks for rating your driver.");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not submit the review. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-sand bg-cream p-3 md:p-4">
      <p className="text-sm font-bold md:text-base">Rate {booking.driver_name}</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className={`grid h-7 w-7 place-items-center rounded-full border transition ${
              value <= rating
                ? "border-primary bg-primary text-white"
                : "border-sand bg-white text-muted"
            }`}
            onClick={() => setRating(value)}
            aria-label={`${value} star rating`}
          >
            <Star
              size={13}
              strokeWidth={2.5}
              fill={value <= rating ? "currentColor" : "none"}
            />
          </button>
        ))}
      </div>
      <AutoGrowTextarea
        className="input mt-3"
        placeholder="Share a quick note about the ride (optional)"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
      />
      {error && <p className="alert-error mt-2">{error}</p>}
      <button
        type="button"
        className="btn-primary mt-3 min-h-[32px] px-3 py-1 text-xs md:min-h-[36px] md:text-sm"
        onClick={submitReview}
        disabled={submitting}
      >
        <Star size={12} strokeWidth={2.5} />
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
}

// Renders the passenger's not-yet-completed booked rides. Used both on the
// standalone /profile/passenger page and inside the profile dropdown menu.
const PASSENGER_FILTERS: { value: "all" | PassengerStateLabel; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
  { value: "Completed", label: "Completed" },
];

export default function BookedRidesList() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [reportBookingId, setReportBookingId] = useState<number | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  // Default to Pending; completed/cancelled/etc. show only when explicitly filtered.
  const [filter, setFilter] = useState<"all" | PassengerStateLabel>("Pending");
  const { data: passengerBookings, refetch } = useQuery({
    queryKey: queryKeys.passenger.bookings,
    queryFn: bookingsApi.list,
  });

  const filteredBookings = passengerBookings
    ?.filter((booking) => filter === "all" || passengerStateLabel(booking) === filter)
    // Most upcoming ride first.
    .sort(
      (a, b) =>
        rideStartMs(a.journey_date, a.departure_time) -
        rideStartMs(b.journey_date, b.departure_time),
    );

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
    setReviewBookingId(null);
    refetch();
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
  }

  return (
    <div className="flex flex-col gap-2.5 md:gap-3">
      {message && <p className="alert-success">{message}</p>}

      {passengerBookings && passengerBookings.length > 0 && (
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {PASSENGER_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                filter === option.value
                  ? "chip-solid"
                  : "chip-outline hover:bg-sand-light"
              }
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {filteredBookings?.map((booking) => (
        <div key={booking.id} className="card p-3 md:p-4">
          <div className="flex flex-col justify-between gap-2.5 sm:flex-row md:gap-4">
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <MapPin size={16} className="text-primary" />
                <h3 className="text-sm font-bold leading-snug md:text-base">
                  {booking.route.replace(/\s+to\s+/i, " -> ")}
                </h3>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted md:mt-2 md:gap-x-4 md:text-sm">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  {formatShortDate(booking.journey_date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  {formatTimeAmPm(booking.departure_time)}
                </span>
                {booking.car_number && (
                  <span className="flex items-center gap-1.5">
                    <Car size={14} className="text-primary" />
                    {booking.car_number}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted md:mt-2 md:text-sm">
                {booking.seats_booked} seats - {booking.pickup_point} to{" "}
                {booking.drop_point}
              </p>
              {booking.passengers && booking.passengers.length > 0 && (
                <p className="mt-1 line-clamp-1 text-xs text-muted md:text-sm">
                  Passengers:{" "}
                  {booking.passengers
                    .map((p) => (p.age != null ? `${p.full_name} (${p.age})` : p.full_name))
                    .join(", ")}
                </p>
              )}
              <Link
                to={`/drivers/${booking.driver_id}`}
                className="mt-1 inline-flex text-xs font-bold text-primary hover:underline"
              >
                View {booking.driver_name}'s profile
              </Link>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 md:mt-2 md:gap-2">
                <StatusChip label={passengerStateLabel(booking)} />
                {booking.review_rating && (
                  <span className="chip-outline">
                    <Star size={10} strokeWidth={2.5} fill="currentColor" />
                    Reviewed {booking.review_rating}
                  </span>
                )}
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
            <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end md:gap-2">
              <Link to={`/rides/${booking.ride_id}?view=1`} className="btn-outline min-h-[32px] px-3 py-1 text-xs md:min-h-[36px] md:text-sm">
                View ride
              </Link>
              {/* Cancel while waiting for approval (pending) or after it is
                  confirmed - but never once the ride's departure has passed. */}
              {CANCELLABLE_BOOKING_STATUSES.includes(
                booking.status as BookingStatus,
              ) &&
                !rideTimePassed(booking.journey_date, booking.departure_time) && (
                <button
                  type="button"
                  className="btn-danger min-h-[32px] px-3 py-1 text-xs md:min-h-[36px] md:text-sm"
                  onClick={() => cancelBooking(booking.id)}
                >
                  <XCircle size={14} />
                  Cancel
                </button>
              )}
              {/* Report only after the ride is completed. */}
              {booking.status === "completed" && (
                <>
                  {!booking.review_rating && (
                    <button
                      type="button"
                      className="btn-primary min-h-[32px] px-3 py-1 text-xs md:min-h-[36px] md:text-sm"
                      onClick={() =>
                        setReviewBookingId((current) =>
                          current === booking.id ? null : booking.id,
                        )
                      }
                    >
                      <Star size={12} strokeWidth={2.5} />
                      Rate driver
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-outline min-h-[32px] px-3 py-1 text-xs md:min-h-[36px] md:text-sm"
                    onClick={() =>
                      setReportBookingId((current) =>
                        current === booking.id ? null : booking.id,
                      )
                    }
                  >
                    <Flag size={14} />
                    Report driver
                  </button>
                </>
              )}
            </div>
          </div>
          {reviewBookingId === booking.id && (
            <ReviewForm booking={booking} onDone={handleFormDone} />
          )}
          {reportBookingId === booking.id && (
            <ReportForm booking={booking} onDone={handleFormDone} />
          )}
        </div>
      ))}

      {passengerBookings?.length === 0 && (
        <p className="alert-info">No unfinished booked rides yet.</p>
      )}
      {passengerBookings &&
        passengerBookings.length > 0 &&
        filteredBookings?.length === 0 && (
          <p className="alert-info">No booked rides match this filter.</p>
        )}
    </div>
  );
}
