import { api } from "./client";
import type {
  NavigationMapConfig,
  NavigationReverse,
  NavigationRoute,
  NavigationRouteOptions,
  NavigationSuggestion
} from "../types";

export const navigationApi = {
  route: (origin_query: string, destination_query: string) =>
    api
      .post<NavigationRoute>("/navigation/route", { origin_query, destination_query })
      .then((r) => r.data),
  routeOptions: (
    origin_query: string,
    destination_query: string,
    max_alternatives = 2,
    origin_position?: number[] | null,
    destination_position?: number[] | null
  ) =>
    api
      .post<NavigationRouteOptions>("/navigation/routes", {
        origin_query,
        destination_query,
        max_alternatives,
        origin_position: origin_position ?? null,
        destination_position: destination_position ?? null
      })
      .then((r) => r.data),
  reverse: (lat: number, lng: number) =>
    api
      .get<NavigationReverse>("/navigation/reverse", { params: { lat, lng } })
      .then((r) => r.data),
  geocode: (q: string) =>
    api.get<NavigationReverse>("/navigation/geocode", { params: { q } }).then((r) => r.data),
  search: (q: string, limit = 5) =>
    api
      .get<NavigationSuggestion[]>("/navigation/search", { params: { q, limit } })
      .then((r) => r.data),
  mapConfig: () =>
    api.get<NavigationMapConfig>("/navigation/map-config").then((r) => r.data)
};

