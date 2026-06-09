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
  driver_mobile_masked?: string;
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

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: "driver" | "passenger";
  age?: number;
  mobile_number?: string;
  whatsapp_number?: string;
  emergency_contact?: string;
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
