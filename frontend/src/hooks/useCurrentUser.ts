import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { queryKeys } from "../lib/queryKeys";
import { useSessionStore } from "../store/session";

// The signed-in user. Disabled (and cache-empty) when there is no token, so it
// is safe to call from guest-visible components. Replaces the repeated
// useQuery({ queryKey: ["me"], queryFn: /auth/me }) scattered across pages.
export function useCurrentUser() {
  const token = useSessionStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false
  });
}
