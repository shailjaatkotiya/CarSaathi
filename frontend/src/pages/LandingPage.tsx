import { ArrowRight, BadgeCheck, Calendar, Car, ListChecks, Map, MapPin, Search, Shield, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";
import RideFlow from "../components/RideFlow";

// Techy digital car dashboard / cockpit shot for the hero visuals.
const DASHBOARD_IMG =
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=80";

const features = [
  [Shield, "Verified profiles", "Aadhaar mock verification keeps trust visible before rides start."],
  [Car, "Homely car comfort", "Choose drivers, cars, AC, pickup points, and flexible halt notes."],
  [Users, "Friendly travel", "Skip the lonely bus and share intercity routes with verified people."],
  [Map, "Gujarat-first routes", "Ahmedabad, Rajkot, Jamnagar, Surat, and nearby city corridors."]
] as const;

const stats = [
  ["10", "fresh seeded rides"],
  ["5+", "pickup and drop points"],
  ["3-10 days", "publish window"]
] as const;

const brands = ["Maruti", "Hyundai", "Tata", "Toyota", "Mahindra", "Kia"] as const;

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
  const [pickup, setPickup] = useState("Ahmedabad");
  const [dropoff, setDropoff] = useState("Rajkot");
  const [pickupDate, setPickupDate] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");

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
      className="grid gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl sm:grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:gap-2 md:rounded-3xl md:p-3"
    >
      <Field icon={MapPin} label="Pick-up location" value={pickup} onChange={setPickup} placeholder="Ahmedabad" />
      <Field icon={Calendar} label="Pick-up date" type="date" value={pickupDate} onChange={setPickupDate} />
      <Field icon={MapPin} label="Drop-off location" value={dropoff} onChange={setDropoff} placeholder="Rajkot" />
      <Field icon={Calendar} label="Drop-off date" type="date" value={dropoffDate} onChange={setDropoffDate} />
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
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6 md:pt-8">
      <section className="relative rounded-[2rem] bg-neutral-950 px-5 pb-8 pt-10 text-white shadow-2xl md:rounded-[2.5rem] md:px-12 md:pb-12 md:pt-14">
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-neutral-800/40 via-transparent to-neutral-950 md:rounded-[2.5rem]" />

        <div className="relative flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-bold tracking-wide text-neutral-200">
            <BadgeCheck size={15} />
            Verified Gujarat intercity carpooling
          </span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Discover your city on wheels with our car ride service
          </h1>
          <p className="mt-4 max-w-xl text-base text-neutral-400 md:text-lg">
            Bored going alone in a bus? Choose a friendly car ride, flexible halts, and a homely intercity travel
            experience.
          </p>
        </div>

        {/* Techy car dashboard with the ride search inside it */}
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 md:rounded-3xl">
          <img
            src={DASHBOARD_IMG}
            alt="Car dashboard"
            className="h-[260px] w-full object-cover grayscale md:h-[360px]"
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-5">
            <RideSearchBar />
          </div>
        </div>
      </section>

      {/* Auth callout */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center md:mt-20">
        <h2 className="text-2xl font-bold text-ink md:text-3xl">Ready to ride?</h2>
        <p className="max-w-md text-muted">Login or create an account to book a seat or publish your own journey.</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/auth?role=passenger"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-neutral-950 px-7 text-sm font-bold text-white transition hover:bg-neutral-800"
          >
            Login / Register
            <ArrowRight size={18} />
          </Link>
          <Link
            to="/search"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-7 text-sm font-bold text-ink transition hover:border-neutral-950"
          >
            Search rides
          </Link>
        </div>
      </div>

      {/* Browse by brand */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">Travel by brand</h3>
          <Link to="/search" className="inline-flex items-center gap-1 text-sm font-bold text-neutral-700 hover:text-neutral-950">
            View all <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand}
              to="/search"
              className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-5 text-sm font-bold text-neutral-800 transition hover:border-neutral-950 hover:shadow-md"
            >
              <Car size={18} className="text-neutral-500" />
              {brand}
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([Icon, title, copy]) => (
          <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-950 text-white">
              <Icon size={20} />
            </span>
            <h3 className="mt-4 font-bold text-ink">{title}</h3>
            <p className="mt-1.5 text-sm text-muted">{copy}</p>
          </div>
        ))}
      </div>

      {/* How it works (from the old Explore page) */}
      <div className="mt-12">
        <RideFlow />
      </div>
    </div>
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
  const primary = isDriver
    ? { to: "/my-rides", label: "Show my Rides" }
    : { to: "/search", label: "Book a Ride" };
  // Passengers can't publish: send them to login so they can sign in as a driver.
  const secondary = isDriver
    ? { to: "/driver/create-ride", label: "Publish my ride" }
    : { to: "/auth?switch=driver", label: "Publish a ride" };

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
                <Car size={18} />
                {secondary.label}
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map(([value, label]) => (
                <div key={label} className="card p-4 shadow-none">
                  <p className="text-xl font-bold">{value}</p>
                  <p className="text-sm text-muted">{label}</p>
                </div>
              ))}
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
