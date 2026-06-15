import { api } from "./client";
import type { Booking, BookingActionResponse, PaymentMethod } from "../types";

export type BookRidePayload = {
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  payment_method: PaymentMethod;
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

export const bookingsApi = {
  list: () => api.get<Booking[]>("/passenger/bookings").then((r) => r.data),
  book: (rideId: number, payload: BookRidePayload) =>
    api.post<BookingActionResponse>(`/passenger/rides/${rideId}/book`, payload).then((r) => r.data),
  cancel: (bookingId: number, reason: string) =>
    api.post(`/passenger/bookings/${bookingId}/cancel`, { reason }).then((r) => r.data),
  verifyPayment: (payload: PaymentVerifyPayload) =>
    api.post<Booking>("/passenger/payments/verify", payload).then((r) => r.data),
  report: (payload: ReportPayload) => api.post("/passenger/reports", payload).then((r) => r.data)
};
