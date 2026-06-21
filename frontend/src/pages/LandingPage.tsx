import { ArrowRight, BadgeCheck, Car, ListChecks, Map, Search, Shield, Users } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../types";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useSessionStore } from "../store/session";
import CitySearch from "../components/CitySearch";
import RideFlow from "../components/RideFlow";
import TravelDatePicker, { getTodayInputDate } from "../components/TravelDatePicker";
import PixelSlideshow from "../components/PixelSlideshow";

// Monochrome car-dashboard illustrations (different intercity routes) that the
// hero cycles through with a pixelate dissolve.
const DASHBOARD_IMAGES = [
  "/car-dashboard-1.svg",
  "/car-dashboard-2.svg",
  "/car-dashboard-3.svg",
  "/car-dashboard-4.svg",
  "/car-dashboard-5.svg"
];

const features = [
  [Shield, "Verified profiles", "Aadhaar mock verification keeps trust visible before rides start."],
  [Car, "Homely car comfort", "Choose drivers, cars, AC, pickup points, and flexible halt notes."],
  [Users, "Friendly travel", "Skip the lonely bus and share intercity routes with verified people."],
  [Map, "Gujarat-first routes", "Ahmedabad, Rajkot, Jamnagar, Surat, and nearby city corridors."]
] as const;

export default function LandingPage() {
  const token = useSessionStore((state) => state.token);
  const { data: user } = useCurrentUser();

  // Guests and signed-in users share the same home; HomeForUser adapts its
  // CTAs and hero copy from the (possibly undefined) user.
  return <HomeForUser user={token ? user : undefined} />;
}

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
      <CitySearch
        label="Pickup"
        value={pickup}
        onChange={setPickup}
        placeholder="Enter pickup city"
        wrapperClassName="flex flex-col gap-1 rounded-xl px-3 py-2 transition hover:bg-neutral-50 md:rounded-2xl"
        labelClassName="text-[11px] font-bold uppercase tracking-wide text-muted"
        inputClassName="w-full bg-transparent text-sm text-ink outline-none placeholder:text-neutral-400"
      />
      <CitySearch
        label="Drop off"
        value={dropoff}
        onChange={setDropoff}
        placeholder="Enter drop off city"
        wrapperClassName="flex flex-col gap-1 rounded-xl px-3 py-2 transition hover:bg-neutral-50 md:rounded-2xl"
        labelClassName="text-[11px] font-bold uppercase tracking-wide text-muted"
        inputClassName="w-full bg-transparent text-sm text-ink outline-none placeholder:text-neutral-400"
      />
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

/* ------------------------------------------------------------------ */
/* Home: shared signed-in and guest entry point                        */
/* ------------------------------------------------------------------ */

function HomeForUser({ user }: { user?: User }) {
  const isSignedIn = Boolean(user);
  const isDriver = user?.role === "driver";
  const isPassenger = user?.role === "passenger";
  const primary = isDriver
    ? { to: "/driver/create-ride", label: "Publish a ride", icon: Car }
    : { to: "/search", label: "Book a Ride", icon: Search };
  const secondary = isDriver
    ? { to: "/my-rides", label: "Published Rides", icon: ListChecks }
    : isPassenger
      ? { to: "/profile/passenger", label: "Booked Rides", icon: ListChecks }
      : { to: "/auth?role=driver", label: "Publish a ride", icon: Car };
  const PrimaryIcon = primary.icon;
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
                {isSignedIn
                  ? isDriver
                    ? "Publish intercity rides and manage passenger requests from Published Rides."
                    : "Book friendly rides and manage your unfinished bookings from Booked Rides."
                  : "Book a friendly car ride, flexible halts, and a homely intercity travel experience."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to={primary.to} className="btn-primary px-6 py-3 text-base">
                <PrimaryIcon size={18} />
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
            <PixelSlideshow images={DASHBOARD_IMAGES} className="block h-[260px] w-full md:h-[390px]" />
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
