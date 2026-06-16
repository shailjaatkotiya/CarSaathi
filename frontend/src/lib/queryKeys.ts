// Centralized React Query keys. Using one factory avoids typo-mismatched keys
// (which silently break cache invalidation) and makes every cached entity
// discoverable in one place.

export const queryKeys = {
  me: ["me"] as const,

  rides: {
    all: ["rides"] as const,
    search: (params: unknown) => ["rides", "search", params] as const,
    detail: (rideId: string | number) => ["ride", rideId] as const,
    fellowPassengers: (rideId: string | number) => ["ride-passengers", rideId] as const
  },

  driver: {
    rides: ["my-rides"] as const,
    vehicles: ["driver-vehicles"] as const,
    rideBookings: (rideId: string | number) => ["ride-bookings", rideId] as const
  },

  passenger: {
    bookings: ["passenger-profile-bookings"] as const,
    savedPassengers: ["passenger-saved-passengers"] as const
  },

  profile: {
    verification: ["profile-verification"] as const
  },

  admin: {
    users: ["admin-users"] as const,
    rides: ["admin-rides"] as const,
    bookings: ["admin-bookings"] as const,
    reports: ["admin-reports"] as const
  }
};
