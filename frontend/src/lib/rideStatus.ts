import type { Booking, Ride } from "../types";
import { ridePhase } from "./format";

// Single source for the human-facing state labels shown on ride detail and the
// ride/booking cards, so they never drift between views.
export type RideStateLabel = "Pending" | "Completed" | "Cancelled";
export type PassengerStateLabel =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Cancelled"
  | "Completed";

// Ride lifecycle: Pending (upcoming or in transit) -> Completed (>= 6h after
// departure, or marked/auto completed). Cancelled stays.
export function rideStateLabel(ride: Ride): RideStateLabel {
  if (ride.status === "cancelled") return "Cancelled";
  if (ride.status === "completed") return "Completed";
  const phase = ridePhase(ride.journey_date, ride.departure_time);
  if (phase === "ended") return "Completed";
  return "Pending";
}

// Passenger booking state mirrors the driver's action (confirmed = Accepted),
// then shifts to Completed once the ride ends. Cancelled covers both driver and
// passenger cancellations (driver ride cancel marks each booking cancelled).
export function passengerStateLabel(booking: Booking): PassengerStateLabel {
  if (booking.status === "cancelled") return "Cancelled";
  if (booking.status === "rejected") return "Rejected";
  if (booking.status === "completed") return "Completed";
  const phase = ridePhase(booking.journey_date, booking.departure_time);
  if (phase === "ended") return "Completed";
  return booking.status === "confirmed" ? "Accepted" : "Pending";
}
