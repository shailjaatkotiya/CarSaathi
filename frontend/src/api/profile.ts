import { api } from "./client";
import type { DriverProfile, User, VerificationStatusResponse } from "../types";

export type ProfileUpdatePayload = Partial<{
  full_name: string;
  whatsapp_number: string | null;
}>;

export const profileApi = {
  driver: (driverId: string | number) =>
    api.get<DriverProfile>(`/profile/drivers/${driverId}`).then((r) => r.data),
  update: (payload: ProfileUpdatePayload) => api.put<User>("/profile", payload).then((r) => r.data),
  submitAadhaar: (aadhaarNumber: string) =>
    api.post<{ masked_aadhaar: string }>("/profile/aadhaar", { aadhaar_number: aadhaarNumber }).then((r) => r.data),
  verificationStatus: () =>
    api.get<VerificationStatusResponse>("/profile/verification-status").then((r) => r.data)
};
