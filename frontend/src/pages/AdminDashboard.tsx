import { useQuery } from "@tanstack/react-query";
import { api, User } from "../api/client";
import MetricCard from "../components/MetricCard";

export default function AdminDashboard() {
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get<User[]>("/admin/users")).data
  });

  return (
    <section className="section pb-24">
      <h1 className="text-2xl font-black">Admin dashboard</h1>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="Users" value={String(users?.length ?? 0)} />
        <MetricCard label="Pending verification" value={String(users?.filter((user) => user.verification_status === "pending").length ?? 0)} />
        <MetricCard label="Blocked users" value={String(users?.filter((user) => user.is_blocked).length ?? 0)} />
        <MetricCard label="Safety reports" value="0" />
      </div>
      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 font-bold">Users and verification</div>
        {users?.map((user) => (
          <div key={user.id} className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{user.full_name}</p>
              <p className="text-sm text-slate-500">{user.email} • {user.role}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">{user.verification_status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
