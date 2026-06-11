import { Car, CheckCircle2, Compass, MessageCircle, Search, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const bookSteps = [
  "Open Passenger and search by city, date, time, price, car category, and pickup area like Bopal, Gota, or Iscon.",
  "Check pickup points, final drop points, and in-between stops such as Limbdi or Chotila before booking.",
  "Choose seats, pickup, and drop-off. After confirmation, WhatsApp details are shared with passenger and driver.",
  "Cancel from Booked Rides when plans change. A WhatsApp cancellation message is logged for both sides."
];

const publishSteps = [
  "Open Driver and publish a ride without login in MVP demo mode.",
  "Choose source, destination, date, time, seats, price, vehicle, in-between stops, and ride instructions.",
  "Publish only between 3 hours and 10 days before departure.",
  "For the same route, one driver can publish maximum 2 rides per day and 5 rides per week.",
  "Cancel a ride from My Rides. Passengers get a WhatsApp cancellation message."
];

const features = [
  "Driver and passenger views only, focused on booking and publishing rides.",
  "Car category support for Mini, Sedan, SUV, and 7 Seater with fuel type.",
  "Safety instructions: no pets, no extra children, no music, no smoking, no alcohol, no tobacco.",
  "Masked contact details before booking and WhatsApp notification logs after booking or cancellation.",
  "Booked Rides shows active passenger bookings. Published Rides shows every published ride with booked passengers."
];

function BulletList({ title, items, icon: Icon }: { title: string; items: string[]; icon: LucideIcon }) {
  return (
    <div className="card h-full p-4">
      <div className="flex items-center gap-2.5">
        <span className="icon-tile">
          <Icon size={16} />
        </span>
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      <div className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed text-muted">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 pb-16 md:py-6">
      <div className="flex flex-col gap-3">
        <div className="card-soft rounded-2xl p-4 md:p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Carthi guide</p>
          <h1 className="mt-0.5 text-xl font-bold md:text-2xl">Explore how to use the app easily</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Book comfortable carpool seats, publish your own intercity ride, manage cancellations, and compare stops
            before choosing a driver.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <BulletList title="How to book a ride" items={bookSteps} icon={Search} />
          <BulletList title="How to publish a ride" items={publishSteps} icon={Car} />
          <BulletList title="Other functionality" items={features} icon={Compass} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="card flex items-start gap-3 p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-bold">Safety-first ride rules</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Drivers can publish clear ride instructions before passengers book, so expectations are set early.
              </p>
            </div>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <MessageCircle size={18} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-bold">WhatsApp-ready updates</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                Booking, passenger cancellation, and driver ride cancellation all create WhatsApp notification logs in
                the MVP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
