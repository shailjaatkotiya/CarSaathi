import { ArrowRight, BadgeCheck, Car, ListChecks, Map, MapPin, Repeat2, Search, Shield, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";
import RideFlow from "../components/RideFlow";
import TravelDatePicker, { getTodayInputDate } from "../components/TravelDatePicker";

const features = [
  [Shield, "Verified profiles", "Govt. ID, email, phone, ratings, and report actions keep trust visible."],
  [Car, "Ride-ready details", "Cars, pickup points, drop points, luggage, comfort rules, and instant booking."],
  [Users, "Shared intercity travel", "Search and publish rides across Mumbai, Pune, Nashik, Nagpur, and more."],
  [Map, "Map placeholder ready", "The product keeps map space empty so the next iteration can plug in the real provider."]
] as const;

export default function LandingPage() {
  const token = useSessionStore((state) => state.token);
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token),
    retry: false
  });

  if (token) {
    return <HomeForUser user={user} />;
  }
  return <GuestLanding />;
}

/* ------------------------------------------------------------------ */
/* Pre-login: dark black/white/grey rental-style landing               */
/* ------------------------------------------------------------------ */

function RideSearchBar() {
  const navigate = useNavigate();
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [pickupDate, setPickupDate] = useState(getTodayInputDate);

  function findVehicle(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (pickup.trim()) params.set("source", pickup.trim());
    if (dropoff.trim()) params.set("destination", dropoff.trim());
    if (pickupDate) params.set("date", pickupDate);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={findVehicle}
      className="overflow-hidden rounded-2xl border-2 border-primary bg-white text-ink shadow-card"
    >
      <div className="divide-y divide-sand">
        <Field icon={MapPin} label="Leaving from" value={pickup} onChange={setPickup} placeholder="Mumbai Central, Maharashtra" />
        <Field icon={MapPin} label="Going to" value={dropoff} onChange={setDropoff} placeholder="Wakad, Pune, Maharashtra" />
        <div className="grid grid-cols-2 divide-x divide-sand">
          <div className="p-3">
            <TravelDatePicker value={pickupDate} onChange={setPickupDate} label="Today" />
          </div>
          <div className="flex items-center gap-2 p-4 text-sm font-bold text-muted">
            <Repeat2 size={18} />
            Return date
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 text-sm font-bold">
          <Users size={18} className="text-muted" />
          1 passenger
        </div>
      </div>
      <button type="submit" className="flex min-h-[64px] w-full items-center justify-center gap-2 bg-primary px-6 text-base font-black text-white transition hover:bg-primary-dark">
        Search
        <ArrowRight size={18} />
      </button>
    </form>
  );
}

function GuestLanding() {
  return (
    <HomeForUser />
  );
}

function Field({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 px-4 py-4 transition hover:bg-primary-soft">
      <span className="flex items-center gap-2">
        <Icon size={18} className="shrink-0 text-muted" />
        <input
          className="w-full bg-transparent text-base font-bold text-ink outline-none placeholder:font-semibold placeholder:text-muted"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
      <span className="sr-only">{label}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Post-login: existing Carthi home with role-based CTAs               */
/* ------------------------------------------------------------------ */

function HomeForUser({ user }: { user?: User }) {
  const isDriver = user?.role === "driver";
  const isPassenger = user?.role === "passenger";
  const primary = isDriver ? { to: "/my-rides", label: "Show my Rides" } : { to: "/search", label: "Book a Ride" };
  const secondary = isDriver
    ? { to: "/driver/create-ride", label: "Publish my ride", icon: Car }
    : isPassenger
    ? { to: "/profile/passenger", label: "Booked Rides", icon: ListChecks }
    : { to: "/auth?switch=driver", label: "Publish a ride", icon: Car };
  const SecondaryIcon = secondary.icon;

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-7">
        <div className="flex flex-col gap-6">
          <span className="inline-flex items-center gap-2 self-start text-lg font-black text-ink">
            <BadgeCheck size={24} className="text-primary" />
            Hello{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
          </span>
          <div>
            <h1 className="text-4xl font-black leading-tight md:text-5xl">Travel anywhere together. Spend smarter.</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
              Maharashtra-first carpooling with verified people, clear pickup points, and ride publishing that captures one detail at a time.
            </p>
          </div>

          {!isDriver && <RideSearchBar />}

          {isDriver && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to={primary.to} className="btn-primary px-6 py-3 text-base">
                <ListChecks size={18} />
                {primary.label}
                <ArrowRight size={18} />
              </Link>
              <Link to={secondary.to} className="btn-outline px-6 py-3 text-base">
                <SecondaryIcon size={18} />
                {secondary.label}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-4 pt-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([Icon, title, copy]) => (
            <div key={title} className="card h-full p-5 shadow-none">
              <span className="icon-tile">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{copy}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6">
        <RideFlow role={user?.role} />
      </div>
    </>
  );
}
