import { api } from "./client";
import type { NavigationRoute } from "../types";

export const navigationApi = {
  ride: (rideId: string | number, pickup_point: string, drop_point: string) =>
    api
      .post<NavigationRoute>(`/navigation/rides/${rideId}`, {
        pickup_point,
        drop_point
      })
      .then((r) => r.data)
};

