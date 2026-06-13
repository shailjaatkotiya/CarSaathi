import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Car,
  CheckCircle2,
  CircleDot,
  Clock3,
  Compass,
  MessageCircle,
  Route,
  Search,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type FlowStep = {
  title: string;
  body: string;
  icon: LucideIcon;
  tag?: string;
};

const appSteps: FlowStep[] = [
  {
    title: "Create account",
    body: "Login or sign up first so profile, booked rides, and published rides stay attached to one user.",
    icon: UserRound,
    tag: "Start"
  },
  {
    title: "Complete profile",
    body: "Add name, WhatsApp number, verification details, and the personal car if you plan to drive.",
    icon: BadgeCheck,
    tag: "Profile"
  },
  {
    title: "Choose a role",
    body: "Use Driver to publish a journey, or Passenger to search and book an available ride.",
    icon: Compass,
    tag: "Role"
  }
];

const driverSteps: FlowStep[] = [
  {
    title: "Driver",
    body: "Open the Driver flow after login and role setup.",
    icon: Car,
    tag: "1"
  },
  {
    title: "Add car to profile",
    body: "Use your profile car, pick a saved vehicle, or add a new car for this ride.",
    icon: ShieldCheck,
    tag: "2"
  },
  {
    title: "Add ride details",
    body: "Enter route, date, time, seats, price, pickup points, drops, stops, and ride rules.",
    icon: Route,
    tag: "3"
  },
  {
    title: "Publish ride",
    body: "Publish between 3 hours and 10 days before departure, then manage it from Published Rides.",
    icon: CheckCircle2,
    tag: "4"
  }
];

const driverLoopSteps: FlowStep[] = [
  {
    title: "View passenger requests",
    body: "Open a published ride and expand booked passengers.",
    icon: UserRound
  },
  {
    title: "Accept or reject",
    body: "Accept to confirm the passenger, or reject to release seats and notify them.",
    icon: CircleDot
  },
  {
    title: "Cancel ride when needed",
    body: "Driver cancellation logs WhatsApp cancellation updates for booked passengers.",
    icon: XCircle
  }
];

const passengerSteps: FlowStep[] = [
  {
    title: "Passenger",
    body: "Open Passenger when you want to find a seat in someone else's car.",
    icon: UserRound,
    tag: "1"
  },
  {
    title: "Search for ride",
    body: "Filter by city, local pickup area, stop or drop area, date, time, price, rating, fuel, AC, seats, and car category.",
    icon: Search,
    tag: "2"
  },
  {
    title: "Book a ride",
    body: "Open ride details, choose seats, pickup point, and drop or in-between stop.",
    icon: CheckCircle2,
    tag: "3"
  },
  {
    title: "Cancel booking",
    body: "Use Booked Rides if plans change. The cancellation is logged for WhatsApp updates.",
    icon: XCircle,
    tag: "4"
  }
];

const ruleCards = [
  {
    title: "Driver approval loop",
    body: "Passenger bookings stay visible to the driver, who can accept or reject each request from Published Rides.",
    icon: CircleDot
  },
  {
    title: "WhatsApp-ready events",
    body: "Booking, acceptance, rejection, passenger cancellation, and driver cancellation create notification logs.",
    icon: MessageCircle
  },
  {
    title: "Time and route discipline",
    body: "Ride publishing is limited to the active travel window and includes pickup, drop, and in-between stops.",
    icon: Clock3
  }
] satisfies FlowStep[];

function StepCard({ step, compact = false }: { step: FlowStep; compact?: boolean }) {
  const Icon = step.icon;

  return (
    <div className={`relative card h-full p-4 shadow-none ${compact ? "min-h-[150px]" : "min-h-[180px]"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="icon-tile">
          <Icon size={18} />
        </span>
        {step.tag && (
          <span className="grid h-8 min-w-8 place-items-center rounded-full bg-primary px-2 text-xs font-bold text-white">
            {step.tag}
          </span>
        )}
      </div>
      <h3 className="mt-4 text-base font-bold">{step.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
    </div>
  );
}

function FlowRow({ steps, compact = false }: { steps: FlowStep[]; compact?: boolean }) {
  const columns =
    steps.length === 3
      ? "lg:grid-cols-[1fr_auto_1fr_auto_1fr]"
      : "lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]";

  return (
    <div className={`grid gap-3 ${columns}`}>
      {steps.map((step, index) => (
        <div key={step.title} className="contents">
          <StepCard step={step} compact={compact} />
          {index < steps.length - 1 && (
            <div className="flex items-center justify-center">
              <ArrowDown className="text-primary lg:hidden" size={20} />
              <ArrowRight className="hidden text-primary lg:block" size={22} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
  icon: Icon
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
          <Icon size={14} />
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-bold md:text-3xl">{title}</h2>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:py-8">
      <div className="flex flex-col gap-5">
        <section className="overflow-hidden rounded-2xl border border-sand bg-white shadow-card">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-primary p-6 text-white md:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-soft">Carthi / RideSaathi flow</p>
              <h1 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">Explore the complete ride journey</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-primary-soft md:text-base">
                This section turns the hand-drawn app flow into a visual guide: profile setup, driver publishing,
                passenger booking, approvals, rejections, and cancellations.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/driver/create-ride" className="btn bg-white text-primary hover:bg-primary-soft">
                  Start as driver
                  <ArrowRight size={17} />
                </Link>
                <Link to="/search" className="btn border border-white/40 bg-primary-dark text-white hover:bg-primary">
                  Search as passenger
                </Link>
              </div>
            </div>
            <div className="grid gap-3 bg-primary-soft p-5 md:p-6">
              <div className="rounded-2xl border border-sand bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Core app map</p>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="icon-tile">
                      <Car size={18} />
                    </span>
                    <div>
                      <p className="font-bold">Driver side</p>
                      <p className="text-sm text-muted">Car &gt; ride details &gt; publish &gt; accept or reject passengers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="icon-tile">
                      <Search size={18} />
                    </span>
                    <div>
                      <p className="font-bold">Passenger side</p>
                      <p className="text-sm text-muted">Search &gt; ride details &gt; book &gt; cancel from booked rides</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/profile" className="card-soft p-4 transition hover:border-primary">
                  <p className="text-xs font-bold text-primary">Profile first</p>
                  <p className="mt-1 text-sm font-bold">Save user and car details</p>
                </Link>
                <Link to="/my-rides" className="card-soft p-4 transition hover:border-primary">
                  <p className="text-xs font-bold text-primary">After publishing</p>
                  <p className="mt-1 text-sm font-bold">Manage passenger requests</p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="card-soft p-4 md:p-5">
          <SectionHeader
            eyebrow="Step 1"
            title="Set up the user before any ride action"
            body="Every important action comes back to one logged-in user, so profile, driver data, and passenger bookings remain separated."
            icon={BadgeCheck}
          />
          <FlowRow steps={appSteps} compact />
        </section>

        <section className="card p-4 md:p-5">
          <SectionHeader
            eyebrow="Driver workflow"
            title="Publish a ride, then manage passengers"
            body="This follows the sketch: driver adds car information, adds ride details, publishes, then accepts, rejects, or cancels from the driver dashboard."
            icon={Car}
          />
          <FlowRow steps={driverSteps} />
          <div className="mt-4 rounded-2xl border border-sand bg-cream p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
              {driverLoopSteps.map((step, index) => (
                <div key={step.title} className="contents">
                  <StepCard step={step} compact />
                  {index < driverLoopSteps.length - 1 && (
                    <div className="flex items-center justify-center">
                      <ArrowDown className="text-primary md:hidden" size={20} />
                      <ArrowRight className="hidden text-primary md:block" size={22} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card p-4 md:p-5">
          <SectionHeader
            eyebrow="Passenger workflow"
            title="Search, book, and cancel when plans change"
            body="Passenger flow stays direct: search available rides, open the details, book seats, then manage unfinished bookings from the passenger profile."
            icon={Search}
          />
          <FlowRow steps={passengerSteps} />
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          {ruleCards.map((card) => (
            <StepCard key={card.title} step={card} compact />
          ))}
        </section>
      </div>
    </div>
  );
}
