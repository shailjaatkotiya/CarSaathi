import { Car, Compass, LogOut, Search, User as UserIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

const navItems = [
  { to: "/driver/create-ride", label: "Driver", icon: Car },
  { to: "/search", label: "Passenger", icon: Search },
  { to: "/explore", label: "Explore", icon: Compass }
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);
  const setToken = useSessionStore((state) => state.setToken);
  const logout = useSessionStore((state) => state.logout);

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

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
      queryClient.clear();
      navigate("/auth", { replace: true });
    }
  }

  return (
    <div className="min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] w-full max-w-6xl items-center justify-between gap-2 px-4 md:min-h-[72px] md:gap-4">
          <Link to="/" className="flex shrink-0 items-center gap-2 md:gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-soft md:h-11 md:w-11">
              <Car size={22} />
            </span>
            <span className="text-lg font-bold leading-none">Carthi</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                    isActive ? "bg-primary text-white" : "text-muted hover:bg-primary-soft hover:text-primary-dark"
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex min-w-0 items-center gap-2">
            <Link to={token ? "/profile" : "/auth"} className="btn-outline px-4 md:px-5">
              <UserIcon size={18} />
              <span className="max-w-[5.5rem] truncate sm:max-w-none">
                {token ? user?.full_name?.split(" ")[0] || "Profile" : "Login"}
              </span>
            </Link>
            {token && (
              <button type="button" className="btn-primary px-4 md:px-5" onClick={handleLogout} aria-label="Logout">
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sand bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-bold transition ${
                isActive ? "text-primary" : "text-muted"
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
