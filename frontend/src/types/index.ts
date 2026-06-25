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

export type VehiclePayload = {
  brand: string;
  model: string;
  vehicle_number: string;
  fuel_type: string;
  car_type: string;
  color: string;
  seats: number;
  photo_urls: string[];
};

// The driver-selected route, persisted on the ride and shown to passengers.
export type SavedRoute = {
  geometry: number[][]; // [lng, lat] pairs forming the polyline
  distance_meters: number;
  duration_seconds: number;
  label: string;
  has_tolls: boolean;
  origin_position?: number[] | null;
  destination_position?: number[] | null;
};

export type Ride = {
  id: number;
  source_city: string;
  destination_city: string;
  source_lat?: number | null;
  source_lng?: number | null;
  destination_lat?: number | null;
  destination_lng?: number | null;
  route?: SavedRoute | null;
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
  driver_id: number;
  driver_name: string;
  driver_rating: number;
  driver_verified: boolean;
  vehicle: Vehicle;
};

export type BookingPassenger = {
  full_name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
};

export type SavedPassenger = {
  id: number;
  full_name: string;
  age?: number | null;
  gender?: string | null;
  phone?: string | null;
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
  passengers?: BookingPassenger[];
  review_rating?: number | null;
  review_comment?: string | null;
  reviewed_at?: string | null;
};

export type DriverReview = {
  id: number;
  booking_id: number;
  rating: number;
  comment?: string | null;
  reviewer_name: string;
  route: string;
  created_at: string;
};

export type DriverProfile = {
  id: number;
  full_name: string;
  rating_average: number;
  rating_count: number;
  reviews: DriverReview[];
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

export type User = {
  id: number;
  full_name: string;
  email: string;
  username?: string | null;
  role: UserRole;
  gender?: string | null;
  mobile_number?: string | null;
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

// ----- Google Maps navigation -----------------------------------------------

export type NavigationPlace = {
  label: string;
  query: string;
  position: number[]; // [lng, lat]
};

export type NavigationStep = {
  instruction: string;
  distance_meters: number;
  duration_seconds: number;
};

export type NavigationRoute = {
  provider: string;
  origin: NavigationPlace;
  destination: NavigationPlace;
  distance_meters: number;
  duration_seconds: number;
  steps: NavigationStep[];
  geometry: number[][];
};

export type NavigationRouteOption = {
  distance_meters: number;
  duration_seconds: number;
  steps: NavigationStep[];
  geometry: number[][];
  has_tolls: boolean;
  road_label: string;
};

export type NavigationRouteOptions = {
  provider: string;
  origin: NavigationPlace;
  destination: NavigationPlace;
  options: NavigationRouteOption[];
};

export type NavigationReverse = {
  label: string;
  position: number[]; // [lng, lat]
  city: string;
};

export type NavigationSuggestion = {
  label: string;
};

export type NavigationMapConfig = {
  provider: string;
  api_key: string;
  language: string;
  region: string;
};
