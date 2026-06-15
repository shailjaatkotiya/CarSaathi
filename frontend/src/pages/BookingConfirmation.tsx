import { CheckCircle2, MessageCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type ConfirmationState = {
  bookingCode?: string;
  status?: string;
  paymentMethod?: "cash" | "online";
};

export default function BookingConfirmation() {
  const state = (useLocation().state as ConfirmationState | null) ?? {};
  const { bookingCode, status, paymentMethod } = state;
  const confirmed = status === "confirmed";

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 md:py-16">
      <div className="card rounded-3xl p-8 text-center md:p-12">
        <div className="flex flex-col items-center gap-4">
          {confirmed ? <CheckCircle2 size={52} className="text-green-600" /> : <MessageCircle size={52} className="text-primary" />}
          <h1 className="text-3xl font-bold md:text-4xl">{confirmed ? "Booking confirmed" : "Booking request sent"}</h1>
          {bookingCode && (
            <p className="text-sm">
              Booking ID <span className="font-bold">{bookingCode}</span>
              {status ? ` · ${status}` : ""}
            </p>
          )}
          <p className="text-muted">
            {confirmed
              ? "Your seat is confirmed. Carthi shares pickup, drop, seat count, and driver details over WhatsApp."
              : "Once the driver confirms, Carthi sends both passenger and driver details through WhatsApp with pickup, drop, seat count, and booking ID."}
          </p>
          {paymentMethod === "cash" && <p className="text-sm text-muted">Pay the driver in cash at the end of the ride.</p>}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/profile/passenger" className="btn-primary">
              View my bookings
            </Link>
            <Link to="/search" className="btn-outline">
              Find another ride
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
