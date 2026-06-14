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
    body: "Drivers publish a journey; passengers search and book an available ride.",
    icon: Compass,
    tag: "Role"
  }
];

const driverSteps: FlowStep[] = [
  {
    title: "Add car to profile",
    body: "Use your profile car, pick a saved vehicle, or add a new car for this ride.",
    icon: ShieldCheck,
    tag: "1"
  },
  {
    title: "Add ride details",
    body: "Enter route, date, time, seats, price, pickup points, drops, stops, and ride rules.",
    icon: Route,
    tag: "2"
  },
  {
    title: "Publish ride",
    body: "Publish between 3 hours and 10 days before departure, then manage it from Published Rides.",
    icon: CheckCircle2,
    tag: "3"
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
    title: "Search for ride",
    body: "Filter by city, local pickup area, stop or drop area, date, time, price, rating, fuel, AC, seats, and car category.",
    icon: Search,
    tag: "1"
  },
  {
    title: "Book a ride",
    body: "Open ride details, choose seats, pickup point, and drop or in-between stop.",
    icon: CheckCircle2,
    tag: "2"
  },
  {
    title: "Cancel booking",
    body: "Use Booked Rides if plans change. The cancellation is logged for WhatsApp updates.",
    icon: XCircle,
    tag: "3"
  }
];

const ruleCards: FlowStep[] = [
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
];

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

// Role-aware "how it works" guide, lifted from the old Explore page.
// driver -> publishing + approval loop; passenger -> search/book/cancel;
// guest/undefined -> account setup overview plus both side summaries.
export default function RideFlow({ role }: { role?: string }) {
  if (role === "driver") {
    return (
      <div className="flex flex-col gap-5">
        <section className="card p-4 md:p-5">
          <SectionHeader
            eyebrow="Driver workflow"
            title="Publish a ride, then manage passengers"
            body="Add car information, add ride details, publish, then accept, reject, or cancel from the driver dashboard."
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

        <section className="grid gap-3 md:grid-cols-3">
          {ruleCards.map((card) => (
            <StepCard key={card.title} step={card} compact />
          ))}
        </section>
      </div>
    );
  }

  if (role === "passenger") {
    return (
      <div className="flex flex-col gap-5">
        <section className="card p-4 md:p-5">
          <SectionHeader
            eyebrow="Passenger workflow"
            title="Search, book, and cancel when plans change"
            body="Search available rides, open the details, book seats, then manage unfinished bookings from your passenger profile."
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
    );
  }

  // Guest overview
  return (
    <div className="flex flex-col gap-5">
      <section className="card-soft p-4 md:p-5">
        <SectionHeader
          eyebrow="How Carthi works"
          title="Set up your user before any ride action"
          body="Every important action comes back to one logged-in user, so profile, driver data, and passenger bookings stay separated."
          icon={BadgeCheck}
        />
        <FlowRow steps={appSteps} compact />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card p-4 md:p-5">
          <SectionHeader eyebrow="Driver side" title="Publish a journey" body="Car > ride details > publish > accept or reject passengers." icon={Car} />
          <FlowRow steps={driverSteps} compact />
        </div>
        <div className="card p-4 md:p-5">
          <SectionHeader eyebrow="Passenger side" title="Find a seat" body="Search > ride details > book > cancel from booked rides." icon={Search} />
          <FlowRow steps={passengerSteps} compact />
        </div>
      </section>
    </div>
  );
}
