import { Car, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

export default function Layout({ children }: { children: ReactNode }) {
  const token = useSessionStore((state) => state.token);
  const setToken = useSessionStore((state) => state.setToken);

  useEffect(() => {
    // Exchange the stored token for a fresh one on app load so an open tab
    // does not silently expire mid-session.
    if (!token) return;
    api
      .post<{ access_token: string }>("/auth/refresh")
      .then(({ data }) => setToken(data.access_token))
      .catch(() => {
        /* 401 handled by the api interceptor */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token),
    retry: false
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] w-full max-w-6xl items-center justify-between gap-2 px-4 md:min-h-[72px] md:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 md:gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-soft md:h-11 md:w-11">
              <Car size={22} />
            </span>
            <span className="text-lg font-bold leading-none">Carthi</span>
          </Link>

          {token ? (
            <Link to="/profile" className="btn-outline px-4 md:px-5">
              <UserIcon size={18} />
              <span className="max-w-[8rem] truncate sm:max-w-none">{user?.full_name?.split(" ")[0] || "Profile"}</span>
            </Link>
          ) : (
            <Link to="/auth" className="btn-primary px-5 md:px-6">
              <UserIcon size={18} />
              Login
            </Link>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
