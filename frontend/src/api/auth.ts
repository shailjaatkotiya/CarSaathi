import { api } from "./client";
import type { TokenResponse, User, UserRole } from "../types";

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  whatsapp_number?: string | null;
  role: UserRole;
};

export const authApi = {
  login: (payload: LoginPayload) => api.post<TokenResponse>("/auth/login", payload).then((r) => r.data),
  register: (payload: RegisterPayload) => api.post<TokenResponse>("/auth/register", payload).then((r) => r.data),
  refresh: () => api.post<TokenResponse>("/auth/refresh").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
  me: () => api.get<User>("/auth/me").then((r) => r.data)
};
