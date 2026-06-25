import { api } from "./client";
import type { TokenResponse, User, UserRole, VehiclePayload } from "../types";

export type LoginPayload = { username: string; password: string };
export type RegisterPayload = {
  full_name: string;
  gender: string;
  mobile_number: string;
  email: string;
  username: string;
  password: string;
  whatsapp_number?: string | null;
  role: UserRole;
  vehicle?: VehiclePayload | null;
};
export type SendOtpPayload = { mobile_number: string };
export type VerifyOtpPayload = SendOtpPayload & { otp: string };
export type SendOtpResponse = { message: string };

export const authApi = {
  login: (payload: LoginPayload) => api.post<TokenResponse>("/auth/login", payload).then((r) => r.data),
  register: (payload: RegisterPayload) => api.post<TokenResponse>("/auth/register", payload).then((r) => r.data),
  sendOtp: (payload: SendOtpPayload) => api.post<SendOtpResponse>("/auth/send-otp", payload).then((r) => r.data),
  verifyOtp: (payload: VerifyOtpPayload) => api.post<TokenResponse>("/auth/verify-otp", payload).then((r) => r.data),
  refresh: () => api.post<TokenResponse>("/auth/refresh").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data)
};
