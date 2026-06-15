import type { BookingStatus } from "../types";

// Booking status mirrors the driver's action: confirmed = driver accepted.
// Single source for the passenger-facing label so it never drifts between views.
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Accepted",
  rejected: "Rejected",
  cancelled: "Cancelled",
  completed: "Completed"
};

export function bookingStatusLabel(status: string): string {
  return BOOKING_STATUS_LABEL[status as BookingStatus] ?? status;
}

// A passenger may still cancel a booking in these states.
export const CANCELLABLE_BOOKING_STATUSES: BookingStatus[] = ["pending", "confirmed"];
