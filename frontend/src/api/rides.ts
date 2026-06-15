import { api } from "./client";
import type { FellowPassenger, Ride } from "../types";

// Search params are passed through verbatim; undefined entries are dropped by axios.
export type RideSearchParams = Record<string, string | number | boolean | undefined>;

export const ridesApi = {
  search: (params: RideSearchParams) => api.get<Ride[]>("/passenger/rides/search", { params }).then((r) => r.data),
  get: (rideId: string | number) => api.get<Ride>(`/passenger/rides/${rideId}`).then((r) => r.data),
  fellowPassengers: (rideId: string | number) =>
    api.get<FellowPassenger[]>(`/passenger/rides/${rideId}/passengers`).then((r) => r.data)
};
