import { MessageCircle } from "lucide-react";

export default function BookingConfirmation() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 pb-24 md:py-16">
      <div className="card rounded-3xl p-8 text-center md:p-12">
        <div className="flex flex-col items-center gap-4">
          <MessageCircle size={52} className="text-primary" />
          <h1 className="text-3xl font-bold md:text-4xl">Booking request sent</h1>
          <p className="text-muted">
            Once the driver confirms, RideSaathi sends both passenger and driver details through WhatsApp with pickup,
            drop, seat count, and booking ID.
          </p>
        </div>
      </div>
    </div>
  );
}
