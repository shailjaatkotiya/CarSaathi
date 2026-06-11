import { ArrowRight, BadgeCheck, Car, Map, Shield, Users } from "lucide-react";
import { Link } from "react-router-dom";
import CarScene from "../components/CarScene";

const routes = [
  { route: "Ahmedabad to Rajkot", price: "Rs. 300-350", distance: "220-250 km", points: "Iscon, SG Highway, Bopal" },
  { route: "Rajkot to Jamnagar", price: "Rs. 150-250", distance: "90-100 km", points: "Bus Stand, Kalawad Road" }
];

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
];

export default function LandingPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-6xl px-4 md:pb-8 md:pt-8">
        <div className="grid items-center gap-5 md:grid-cols-2 md:gap-12">
          <div className="flex flex-col gap-6">
            <span className="chip-solid self-start px-4 py-1.5">
              <BadgeCheck size={15} />
              Verified Gujarat intercity carpooling
            </span>
            <div>
              <h1 className="text-5xl font-bold leading-none md:text-7xl">Carthi</h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
                Bored going alone in a bus? Choose a friendly car ride, flexible halts, and a homely intercity travel
                experience.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/search" className="btn-primary px-6 py-3 text-base">
                Find a ride
                <ArrowRight size={18} />
              </Link>
              <Link to="/driver/create-ride" className="btn-outline px-6 py-3 text-base">
                Publish your journey
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

          <div className="overflow-hidden rounded-3xl">
            <div className="relative min-h-[260px] overflow-hidden rounded-t-3xl md:min-h-[390px]">
              <CarScene />
            </div>
            {/* <div className="flex flex-col gap-3 p-5">
              {routes.map((item) => (
                <div key={item.route} className="rounded-xl border border-sand p-4">
                  <div className="flex justify-between gap-4">
                    <p className="font-bold">{item.route}</p>
                    <p className="font-bold text-primary">{item.price}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {item.distance} · {item.points}
                  </p>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4">
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
    </>
  );
}
