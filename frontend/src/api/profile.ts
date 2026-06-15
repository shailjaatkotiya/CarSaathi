import { api } from "./client";
import type { User, VerificationStatusResponse } from "../types";

export type ProfileUpdatePayload = Partial<{
  full_name: string;
  whatsapp_number: string | null;
}>;

export const profileApi = {
  update: (payload: ProfileUpdatePayload) => api.put<User>("/profile", payload).then((r) => r.data),
  submitAadhaar: (aadhaarNumber: string) =>
    api.post<{ masked_aadhaar: string }>("/profile/aadhaar", { aadhaar_number: aadhaarNumber }).then((r) => r.data),
  verificationStatus: () =>
    api.get<VerificationStatusResponse>("/profile/verification-status").then((r) => r.data)
};
