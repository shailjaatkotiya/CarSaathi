// Domain types shared across the app. Single source of truth — components and
// API service modules import from here instead of re-declaring local shapes.

export type UserRole = "admin" | "driver" | "passenger";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled" | "completed";

export type RideStatus = "draft" | "active" | "cancelled" | "completed";

export type PaymentMethod = "cash" | "online";

export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  vehicle_number: string;
  fuel_type: string;
  car_type: string;
  color: string;
  seats: number;
  photo_urls: string[];
  is_verified: boolean;
};

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
  auto_confirm_bookings: boolean;
  status: RideStatus;
  driver_name: string;
  driver_rating: number;
  driver_verified: boolean;
  vehicle: Vehicle;
};

export type Booking = {
  id: number;
  booking_code: string;
  ride_id: number;
  passenger_id: number;
  driver_id: number;
  driver_name: string;
  driver_whatsapp?: string | null;
  car_number?: string | null;
  car_color?: string | null;
  route: string;
  journey_date: string;
  departure_time: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: BookingStatus;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: string;
};

// Booking row as the driver sees it (adds passenger contact fields).
export type DriverBooking = Booking & {
  passenger_name: string;
  passenger_whatsapp?: string | null;
};

export type FellowPassenger = {
  name: string;
  pickup_point: string;
  drop_point: string;
  seats_booked: number;
};

export type NavigationPlace = {
  label: string;
  query: string;
  position: number[];
};

export type NavigationStep = {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
};

export type NavigationRoute = {
  provider: "amazon-location";
  origin: NavigationPlace;
  destination: NavigationPlace;
  distance_meters: number;
  duration_seconds: number;
  steps: NavigationStep[];
  geometry: number[][];
};

export type User = {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  whatsapp_number?: string;
  personal_car_brand?: string;
  personal_car_model?: string;
  personal_car_number?: string;
  personal_car_fuel_type?: string;
  personal_car_category?: string;
  personal_car_color?: string;
  personal_car_seats?: number;
  verification_status: VerificationStatus;
  is_blocked: boolean;
  rating_average: number;
  rating_count: number;
};

export type VerificationStatusResponse = {
  status: VerificationStatus;
  masked_aadhaar?: string;
  rejection_reason?: string;
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

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};
