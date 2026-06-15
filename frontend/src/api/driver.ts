import { api } from "./client";
import type { DriverBooking, Ride, Vehicle } from "../types";

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

export const driverApi = {
  rides: () => api.get<Ride[]>("/driver/rides").then((r) => r.data),
  rideBookings: (rideId: string | number) =>
    api.get<DriverBooking[]>(`/driver/rides/${rideId}/bookings`).then((r) => r.data),
  publishRide: (payload: Record<string, unknown>) => api.post<Ride>("/driver/rides", payload).then((r) => r.data),
  cancelRide: (rideId: number, reason = "Driver cancelled from app") =>
    api.post(`/driver/rides/${rideId}/cancel`, { reason }).then((r) => r.data),
  completeRide: (rideId: number) => api.post(`/driver/rides/${rideId}/complete`).then((r) => r.data),
  acceptBooking: (bookingId: number) => api.post(`/driver/bookings/${bookingId}/accept`).then((r) => r.data),
  rejectBooking: (bookingId: number) => api.post(`/driver/bookings/${bookingId}/reject`).then((r) => r.data),

  vehicles: () => api.get<Vehicle[]>("/driver/vehicles").then((r) => r.data),
  addVehicle: (payload: VehiclePayload) => api.post<Vehicle>("/driver/vehicles", payload).then((r) => r.data),
  updateVehicle: (vehicleId: number, payload: VehiclePayload) =>
    api.put<Vehicle>(`/driver/vehicles/${vehicleId}`, payload).then((r) => r.data)
};
