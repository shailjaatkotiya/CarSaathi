import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useSessionStore } from "../store/session";
import type { UserRole } from "../types";

export default function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const token = useSessionStore((state) => state.token);
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();
  const authTarget = `/auth?role=${role}`;

  if (!token) {
    return <Navigate to={authTarget} replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <p className="alert-info">Checking your account access...</p>
      </div>
    );
  }

  if (user?.role !== role) {
    return <Navigate to={authTarget} replace state={{ from: location.pathname, requiredRole: role }} />;
  }

  return <>{children}</>;
}
