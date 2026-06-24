import { api } from "./client";
import type { Booking, BookingActionResponse, DriverReview, PaymentMethod, SavedPassenger } from "../types";

export type PassengerInput = {
  full_name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
  save?: boolean;
};

export type BookRidePayload = {
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  payment_method: PaymentMethod;
  passengers: PassengerInput[];
};

export type SavedPassengerPayload = {
  full_name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
};

export type PaymentVerifyPayload = {
  booking_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type ReportPayload = {
  reported_user_id: number;
  ride_id: number;
  reason: string;
};

export type ReviewPayload = {
  rating: number;
  comment?: string | null;
};

export const bookingsApi = {
  list: () => api.get<Booking[]>("/passenger/bookings").then((r) => r.data),
  book: (rideId: number, payload: BookRidePayload) =>
    api.post<BookingActionResponse>(`/passenger/rides/${rideId}/book`, payload).then((r) => r.data),
  cancel: (bookingId: number, reason: string) =>
    api.post(`/passenger/bookings/${bookingId}/cancel`, { reason }).then((r) => r.data),
  verifyPayment: (payload: PaymentVerifyPayload) =>
    api.post<Booking>("/passenger/payments/verify", payload).then((r) => r.data),
  report: (payload: ReportPayload) => api.post("/passenger/reports", payload).then((r) => r.data),
  review: (bookingId: number, payload: ReviewPayload) =>
    api.post<DriverReview>(`/passenger/bookings/${bookingId}/review`, payload).then((r) => r.data),
  savedPassengers: () => api.get<SavedPassenger[]>("/passenger/saved-passengers").then((r) => r.data),
  addSavedPassenger: (payload: SavedPassengerPayload) =>
    api.post<SavedPassenger>("/passenger/saved-passengers", payload).then((r) => r.data),
  updateSavedPassenger: (id: number, payload: SavedPassengerPayload) =>
    api.put<SavedPassenger>(`/passenger/saved-passengers/${id}`, payload).then((r) => r.data),
  deleteSavedPassenger: (id: number) =>
    api.delete(`/passenger/saved-passengers/${id}`).then((r) => r.data)
};
