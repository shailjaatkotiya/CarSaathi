import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

type Role = "admin" | "driver" | "passenger";

export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const token = useSessionStore((state) => state.token);
  const location = useLocation();
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token),
    retry: false
  });

  const authTarget = `/auth?role=${role}`;

  if (!token) {
    return <Navigate to={authTarget} replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <p className="alert-info">Checking your account role...</p>
      </div>
    );
  }

  if (user?.role !== role) {
    return <Navigate to={authTarget} replace state={{ from: location.pathname, requiredRole: role }} />;
  }

  return <>{children}</>;
}
