import { Car, CirclePlus, MessageCircle, Search, User as UserIcon, Waypoints } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

export default function Layout({ children }: { children: ReactNode }) {
  const token = useSessionStore((state) => state.token);
  const setToken = useSessionStore((state) => state.setToken);
  const location = useLocation();

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

  const navItems = [
    { to: "/search", label: "Search", icon: Search },
    { to: token ? "/driver/create-ride" : "/auth?switch=driver", label: "Publish", icon: CirclePlus },
    { to: token ? (user?.role === "driver" ? "/my-rides" : "/profile/passenger") : "/auth", label: "Your rides", icon: Waypoints },
    { to: "/profile", label: "Inbox", icon: MessageCircle },
    { to: token ? "/profile" : "/auth", label: "Profile", icon: UserIcon }
  ];

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] w-full max-w-6xl items-center justify-between gap-2 px-4 md:min-h-[72px] md:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 md:gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-soft md:h-11 md:w-11">
              <Car size={22} />
            </span>
            <span className="text-lg font-black leading-none">Carthi</span>
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

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-sand bg-white/95 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[72px] w-full max-w-3xl grid-cols-5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.to.split("?")[0] === "/"
                ? location.pathname === "/"
                : location.pathname === item.to.split("?")[0] || (item.label === "Profile" && location.pathname.startsWith("/profile"));
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition ${
                  active ? "text-primary" : "text-muted hover:text-primary"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.7 : 2} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
