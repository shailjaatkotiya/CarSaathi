import { api } from "./client";
import type { TokenResponse, User } from "../types";

export type AdminRide = {
  id: number;
  route: string;
  date: string;
  driver: string;
  available_seats: number;
  status: string;
};

export type AdminBooking = {
  id: number;
  booking_code: string;
  route: string;
  passenger: string;
  seats: number;
  status: string;
};

export type AdminReport = {
  id: number;
  reporter_id: number;
  reported_user_id: number;
  reason: string;
  status: string;
};

export const adminApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("/admin/login", { email, password }).then((r) => r.data),
  users: () => api.get<User[]>("/admin/users").then((r) => r.data),
  rides: () => api.get<AdminRide[]>("/admin/rides").then((r) => r.data),
  bookings: () => api.get<AdminBooking[]>("/admin/bookings").then((r) => r.data),
  reports: () => api.get<AdminReport[]>("/admin/reports").then((r) => r.data),
  verifyUser: (userId: number) => api.post(`/admin/users/${userId}/verify`).then((r) => r.data),
  rejectUser: (userId: number, reason: string) =>
    api.post(`/admin/users/${userId}/reject`, { reason }).then((r) => r.data),
  blockUser: (userId: number, reason: string) =>
    api.post(`/admin/users/${userId}/block`, { reason }).then((r) => r.data)
};
