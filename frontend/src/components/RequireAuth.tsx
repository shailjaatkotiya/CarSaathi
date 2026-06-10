import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSessionStore } from "../store/session";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const token = useSessionStore((state) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
