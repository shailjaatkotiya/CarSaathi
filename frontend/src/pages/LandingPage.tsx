import { ArrowRight, BadgeCheck, Car, ListChecks, Map, MapPin, Search, Shield, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";
import RideFlow from "../components/RideFlow";
import TravelDatePicker, { getTodayInputDate } from "../components/TravelDatePicker";

// Techy digital car dashboard / cockpit shot for the hero visuals.
const DASHBOARD_IMG =
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80";

const features = [
  [Shield, "Verified profiles", "Aadhaar mock verification keeps trust visible before rides start."],
  [Car, "Homely car comfort", "Choose drivers, cars, AC, pickup points, and flexible halt notes."],
  [Users, "Friendly travel", "Skip the lonely bus and share intercity routes with verified people."],
  [Map, "Gujarat-first routes", "Ahmedabad, Rajkot, Jamnagar, Surat, and nearby city corridors."]
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
      className="grid gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl sm:grid-cols-2 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-2 md:rounded-3xl md:p-3"
    >
      <Field icon={MapPin} label="Pickup" value={pickup} onChange={setPickup} placeholder="Enter pickup city" />
      <Field icon={MapPin} label="Drop off" value={dropoff} onChange={setDropoff} placeholder="Enter drop off city" />
      <TravelDatePicker value={pickupDate} onChange={setPickupDate} />
      <button
        type="submit"
        className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-neutral-950 px-6 text-sm font-bold text-white transition hover:bg-neutral-800 md:rounded-2xl"
      >
        Find a ride
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
    <label className="flex flex-col gap-1 rounded-xl px-3 py-2 transition hover:bg-neutral-50 md:rounded-2xl">
      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{label}</span>
      <span className="flex items-center gap-2">
        <Icon size={16} className="shrink-0 text-neutral-400" />
        <input
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-neutral-400"
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      </span>
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
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 md:py-4">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col gap-6">
            <span className="chip-solid self-start px-4 py-1.5">
              <BadgeCheck size={15} />
              Verified Gujarat intercity carpooling
            </span>
            <div>
              <h1 className="text-5xl font-bold leading-none md:text-7xl">
                {user?.full_name ? `Welcome, ${user.full_name.split(" ")[0]}` : "Carthi"}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
                {isDriver
                  ? "Manage the rides you publish or open a new intercity journey for verified passengers."
                  : "Book a friendly car ride, flexible halts, and a homely intercity travel experience."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={primary.to} className="btn-primary px-6 py-3 text-base">
                {isDriver ? <ListChecks size={18} /> : <Search size={18} />}
                {primary.label}
                <ArrowRight size={18} />
              </Link>
              <Link to={secondary.to} className="btn-outline px-6 py-3 text-base">
                <SecondaryIcon size={18} />
                {secondary.label}
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-sand">
            <img
              src={DASHBOARD_IMG}
              alt="Car dashboard"
              className="h-[260px] w-full object-cover grayscale md:h-[390px]"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {!isDriver && (
        <div className="mx-auto w-full max-w-6xl px-4 pb-4">
          <h2 className="mb-3 text-xl font-bold">Search published rides</h2>
          <RideSearchBar />
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl px-4 pb-4 pt-4">
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
