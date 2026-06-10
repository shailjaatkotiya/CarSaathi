import { Car, Compass, LogOut, Search, User as UserIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
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
  const logout = useSessionStore((state) => state.logout);

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
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-white shadow-soft">
              <Car size={22} />
            </span>
            <span>
              <span className="block text-lg font-bold leading-none">RideSaathi</span>
              <span className="block text-xs text-muted">Gujarat intercity carpooling</span>
            </span>
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

          <div className="flex items-center gap-2">
            <Link to={token ? "/profile" : "/auth"} className="btn-outline">
              <UserIcon size={18} />
              {token ? user?.full_name?.split(" ")[0] || "Profile" : "Login"}
            </Link>
            {token && (
              <button type="button" className="btn-primary" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sand bg-cream/95 backdrop-blur-xl md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-bold transition ${
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
