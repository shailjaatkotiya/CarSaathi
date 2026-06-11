import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";
import { api, User } from "../api/client";
import MetricCard from "../components/MetricCard";
import { useSessionStore } from "../store/session";

type AdminRide = {
  id: number;
  route: string;
  date: string;
  driver: string;
  available_seats: number;
  status: string;
};

type AdminBooking = {
  id: number;
  booking_code: string;
  route: string;
  passenger: string;
  seats: number;
  status: string;
};

type AdminReport = {
  id: number;
  reporter_id: number;
  reported_user_id: number;
  reason: string;
  status: string;
};

type AdminTab = "users" | "rides" | "bookings" | "reports";

function AdminLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const setToken = useSessionStore((state) => state.setToken);
  const [email, setEmail] = useState("admin@carthi.in");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/admin/login", { email, password });
      setToken(data.access_token);
      onLoggedIn();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Admin login failed.");
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-6 flex w-full max-w-md flex-col gap-4 p-6">
      <h2 className="text-xl font-bold">Admin login</h2>
      <label>
        <span className="field-label">Email</span>
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </label>
      <label>
        <span className="field-label">Password</span>
        <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </label>
      {error && <p className="alert-error">{error}</p>}
      <button className="btn-primary" type="submit">
        Login as admin
      </button>
    </form>
  );
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const token = useSessionStore((state) => state.token);
  const [tab, setTab] = useState<AdminTab>("users");
  const [message, setMessage] = useState("");

  const { data: users, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get<User[]>("/admin/users")).data,
    enabled: Boolean(token),
    retry: false
  });
  const { data: rides } = useQuery({
    queryKey: ["admin-rides"],
    queryFn: async () => (await api.get<AdminRide[]>("/admin/rides")).data,
    enabled: Boolean(token) && Boolean(users),
    retry: false
  });
  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => (await api.get<AdminBooking[]>("/admin/bookings")).data,
    enabled: Boolean(token) && Boolean(users),
    retry: false
  });
  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => (await api.get<AdminReport[]>("/admin/reports")).data,
    enabled: Boolean(token) && Boolean(users),
    retry: false
  });

  const isForbidden = axios.isAxiosError(usersError) && usersError.response?.status === 403;

  if (!token || isForbidden) {
    return (
      <section className="section">
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        {isForbidden && <p className="alert-warning mt-3">Your current login is not an admin account. Login with admin credentials.</p>}
        <AdminLogin onLoggedIn={() => queryClient.invalidateQueries()} />
      </section>
    );
  }

  async function verifyUser(userId: number) {
    await api.post(`/admin/users/${userId}/verify`);
    setMessage("User verified.");
    refetchUsers();
  }

  async function rejectUser(userId: number) {
    await api.post(`/admin/users/${userId}/reject`, { reason: "Rejected by admin from dashboard" });
    setMessage("User verification rejected.");
    refetchUsers();
  }

  async function blockUser(userId: number) {
    await api.post(`/admin/users/${userId}/block`, { reason: "Blocked by admin from dashboard" });
    setMessage("User blocked.");
    refetchUsers();
  }

  const tabs: { value: AdminTab; label: string }[] = [
    { value: "users", label: "Users" },
    { value: "rides", label: "Rides" },
    { value: "bookings", label: "Bookings" },
    { value: "reports", label: "Reports" }
  ];

  return (
    <section className="section">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Users" value={String(users?.length ?? 0)} />
        <MetricCard label="Pending verification" value={String(users?.filter((user) => user.verification_status === "pending").length ?? 0)} />
        <MetricCard label="Blocked users" value={String(users?.filter((user) => user.is_blocked).length ?? 0)} />
        <MetricCard label="Safety reports" value={String(reports?.length ?? 0)} />
      </div>
      {message && <p className="alert-success mt-4">{message}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              tab === item.value ? "bg-primary text-white" : "bg-cream text-muted hover:text-primary-dark"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "users" && (
        <div className="card mt-5 overflow-hidden">
          <div className="border-b border-sand px-4 py-3 font-bold">Users and verification</div>
          {users?.map((user) => (
            <div key={user.id} className="flex flex-col gap-2 border-b border-sand-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip">{user.verification_status}</span>
                {user.is_blocked && <span className="chip">blocked</span>}
                {user.verification_status !== "verified" && (
                  <button type="button" className="btn-primary" onClick={() => verifyUser(user.id)}>
                    Verify
                  </button>
                )}
                {user.verification_status === "pending" && (
                  <button type="button" className="btn-outline" onClick={() => rejectUser(user.id)}>
                    Reject
                  </button>
                )}
                {!user.is_blocked && (
                  <button type="button" className="btn-danger" onClick={() => blockUser(user.id)}>
                    Block
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "rides" && (
        <div className="card mt-5 overflow-hidden">
          <div className="border-b border-sand px-4 py-3 font-bold">All rides</div>
          {rides?.map((ride) => (
            <div key={ride.id} className="flex flex-col gap-1 border-b border-sand-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{ride.route}</p>
                <p className="text-sm text-muted">
                  {ride.date} · driver {ride.driver} · {ride.available_seats} seats left
                </p>
              </div>
              <span className="chip self-start sm:self-center">{ride.status}</span>
            </div>
          ))}
          {rides?.length === 0 && <p className="px-4 py-3 text-sm text-muted">No rides yet.</p>}
        </div>
      )}

      {tab === "bookings" && (
        <div className="card mt-5 overflow-hidden">
          <div className="border-b border-sand px-4 py-3 font-bold">All bookings</div>
          {bookings?.map((booking) => (
            <div key={booking.id} className="flex flex-col gap-1 border-b border-sand-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{booking.booking_code}</p>
                <p className="text-sm text-muted">
                  {booking.route} · {booking.passenger} · {booking.seats} seats
                </p>
              </div>
              <span className="chip self-start sm:self-center">{booking.status}</span>
            </div>
          ))}
          {bookings?.length === 0 && <p className="px-4 py-3 text-sm text-muted">No bookings yet.</p>}
        </div>
      )}

      {tab === "reports" && (
        <div className="card mt-5 overflow-hidden">
          <div className="border-b border-sand px-4 py-3 font-bold">Safety reports</div>
          {reports?.map((report) => (
            <div key={report.id} className="flex flex-col gap-1 border-b border-sand-light px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">
                  Reporter #{report.reporter_id} reported user #{report.reported_user_id}
                </p>
                <p className="text-sm text-muted">{report.reason}</p>
              </div>
              <span className="chip self-start sm:self-center">{report.status}</span>
            </div>
          ))}
          {reports?.length === 0 && <p className="px-4 py-3 text-sm text-muted">No reports yet.</p>}
        </div>
      )}
    </section>
  );
}
