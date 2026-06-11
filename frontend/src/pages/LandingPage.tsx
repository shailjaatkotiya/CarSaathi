import {
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  Map,
  Shield,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import CarScene from "../components/CarScene";

const workflowSteps = [
  {
    icon: Map,
    title: "Find your route",
    copy: "Browse verified intercity rides across Gujarat in minutes.",
  },
  {
    icon: Shield,
    title: "Confirm trust",
    copy: "Check driver details, reviews, and safety signals before you travel.",
  },
  {
    icon: Car,
    title: "Ride with ease",
    copy: "Book, meet up, and enjoy a friendly, comfortable trip to your destination.",
  },
] as const;

const stats = [
  ["10", "fresh seeded rides"],
  ["5+", "pickup and drop points"],
  ["3-10 days", "publish window"],
];

export default function LandingPage() {
  return (
    <div className="relative h-[90vh] overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <CarScene className="absolute inset-0 h-full w-full " />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),rgba(248,250,252,0.35),rgba(255,255,255,0.55))]/90" />
      </div>

      <main className="relative z-10 mx-auto flex h-[100vh] w-full max-w-7xl items-center px-4 py-4 md:px-6 lg:px-8">
        <section className="grid h-full w-full items-center gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="flex max-h-[calc(100vh-2rem)] flex-col gap-5 rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),rgba(248,250,252,0.35),rgba(255,255,255,0.55))]/50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-md md:p-8">
            <span className="chip-solid self-start px-4 py-1.5">
              <BadgeCheck size={15} />
              Verified Gujarat intercity carpooling
            </span>

            <div className="space-y-4">
              <p className="text-sm uppercase font-white tracking-[0.35em] text-muted">
                Ride smart. Travel local.
              </p>
              <h1 className="max-w-xl text-5xl font-black leading-none md:text-6xl xl:text-7xl">
                Carthi
              </h1>
              <p className="max-w-xl text-base font-black leading-relaxed md:text-lg">
                Skip the lonely bus. Find verified rides, flexible halts, and a
                friendly way to move across Gujarat.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/search" className="btn-primary px-6 py-3 text-base">
                Find a ride
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/driver/create-ride"
                className="btn-outline px-6 py-3 text-base"
              >
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
            <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/95 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
                <p className="text-sm text-slate-700">
                  Carthi helps riders compare routes, confirm safety signals,
                  and start their journey with confidence.
                </p>
              </div>
            </div>
          </article>

          <aside className="flex max-h-[calc(100vh-2rem)] flex-col justify-center rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),rgba(248,250,252,0.35),rgba(255,255,255,0.55))]/50 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-md md:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-primary">
                  How it works
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
                  Plan Your Ride
                </h2>
              </div>
              <span className="rounded-full bg-primary/10 p-2 text-primary">
                <Sparkles size={18} />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-sand bg-white/95 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted">
                          <span className="font-semibold text-primary">
                            Step {index + 1}
                          </span>
                          <span>•</span>
                          <span>Pointer flow</span>
                        </div>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted">{step.copy}</p>
                      </div>
                    </div>
                    {index < workflowSteps.length - 1 ? (
                      <div className="mt-3 flex items-center gap-2 pl-13 text-primary">
                        <span className="h-0.5 w-8 bg-primary/60" />
                        <ArrowRight size={14} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
