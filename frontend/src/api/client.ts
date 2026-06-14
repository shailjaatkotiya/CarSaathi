import axios from "axios";
import { useSessionStore } from "../store/session";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
});

api.interceptors.request.use((config) => {
  const token = useSessionStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useSessionStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export type Ride = {
  id: number;
  source_city: string;
  destination_city: string;
  distance_km: number;
  journey_date: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  price_per_seat: number;
  pickup_points: string[];
  drop_points: string[];
  route_notes?: string;
  luggage_allowance?: string;
  route_stops: string[];
  ride_rules: string[];
  driver_instructions?: string;
  smoking_allowed: boolean;
  ac_available: boolean;
  women_only_preference: boolean;
  status: string;
  driver_name: string;
  driver_rating: number;
  driver_verified: boolean;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    vehicle_number: string;
    fuel_type: string;
    car_type: string;
    seats: number;
    photo_urls: string[];
    is_verified: boolean;
  };
};

export type Booking = {
  id: number;
  booking_code: string;
  ride_id: number;
  passenger_id: number;
  driver_id: number;
  driver_name: string;
  route: string;
  journey_date: string;
  departure_time: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
  payment_method: "cash" | "online";
  payment_status: string;
};

export type PaymentInit = {
  razorpay_order_id: string;
  razorpay_key_id: string;
  amount: number; // paise
  currency: string;
  booking_code: string;
};

export type BookingActionResponse = {
  booking: Booking;
  payment: PaymentInit | null;
};

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Loads the Razorpay Checkout script once and resolves when window.Razorpay is ready.
export function loadRazorpayCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: "admin" | "driver" | "passenger";
  age?: number;
  whatsapp_number?: string;
  personal_car_brand?: string;
  personal_car_model?: string;
  personal_car_number?: string;
  personal_car_fuel_type?: string;
  personal_car_category?: string;
  personal_car_seats?: number;
  verification_status: "pending" | "verified" | "rejected";
  is_blocked: boolean;
  rating_average: number;
  rating_count: number;
};
