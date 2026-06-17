import { AlertTriangle, Banknote, Car, CreditCard, Fuel, Hash, MessageCircle, Palette, Share2, ShieldCheck, Users, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { bookingsApi, type PassengerInput } from "../api/bookings";
import { ridesApi } from "../api/rides";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiErrorMessage } from "../lib/apiError";
import { validatePassengerEntries } from "../lib/bookingValidation";
import { formatShortDate, formatTimeAmPm } from "../lib/format";
import { loadRazorpayCheckout } from "../lib/razorpay";
import { queryKeys } from "../lib/queryKeys";
import type { BookingActionResponse } from "../types";
import StatusChip from "../components/StatusChip";
import { rideStateLabel } from "../lib/rideStatus";
import PassengerSeats, { emptySeatEntry, type SeatEntry } from "../components/PassengerSeats";
import { useSessionStore } from "../store/session";

const ruleLabels: Record<string, string> = {
  no_pets: "No pets",
  no_extra_children: "No extra children",
  no_music: "No music",
  no_smoking: "No smoking",
  no_alcohol: "No alcohol",
  no_tobacco: "No tobacco"
};

export default function RideDetail() {
  const { rideId } = useParams();
  const [searchParams] = useSearchParams();
  const isViewOnly = searchParams.get("view") === "1";
  const [seatEntries, setSeatEntries] = useState<SeatEntry[]>([emptySeatEntry()]);
  const seats = seatEntries.length;
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const token = useSessionStore((state) => state.token);
  const navigate = useNavigate();
  const { data: ride, refetch } = useQuery({
    queryKey: queryKeys.rides.detail(rideId ?? ""),
    queryFn: () => ridesApi.get(rideId!),
    enabled: Boolean(rideId)
  });
  const { data: me } = useCurrentUser();
  const { data: fellowPassengers } = useQuery({
    queryKey: queryKeys.rides.fellowPassengers(rideId ?? ""),
    queryFn: () => ridesApi.fellowPassengers(rideId!),
    enabled: Boolean(rideId)
  });
  const missingContactNumber = Boolean(me) && !me?.whatsapp_number?.trim();
  const isDriver = me?.role === "driver";

  const { data: savedPassengers } = useQuery({
    queryKey: queryKeys.passenger.savedPassengers,
    queryFn: bookingsApi.savedPassengers,
    enabled: Boolean(token) && !isDriver
  });

  // Prefill the first seat with the account holder's name once loaded.
  useEffect(() => {
    if (!me) return;
    setSeatEntries((current) => {
      if (current.length !== 1 || current[0].savedId || current[0].full_name) return current;
      return [emptySeatEntry(me.full_name)];
    });
  }, [me]);

  // Keep one passenger entry per booked seat.
  function setSeats(count: number) {
    const requested = Number.isFinite(count) ? count : 1;
    const safeMax = Math.max(0, ride?.available_seats ?? 0);
    const next = Math.max(1, Math.min(requested, safeMax || 1));
    setSeatEntries((current) => {
      if (next === current.length) return current;
      if (next < current.length) return current.slice(0, next);
      return [...current, ...Array.from({ length: next - current.length }, () => emptySeatEntry())];
    });
  }

  const paymentAmount = useMemo(() => (ride ? seats * ride.price_per_seat : 0), [ride, seats]);
  const instructionLines = useMemo(() => {
    if (!ride) return [];
    const fromRules = ride.ride_rules.map((rule) => ruleLabels[rule] ?? rule.replace(/_/g, " "));
    const fromText = (ride.driver_instructions ?? "")
      .split("\n")
      .map((line) => line.trim().replace(/^-+\s*/, ""))
      .filter(Boolean);
    return Array.from(new Set([...fromRules, ...fromText]));
  }, [ride]);

  async function book() {
    if (!ride) return;
    if (!token) {
      navigate("/auth?role=passenger", { state: { from: `/rides/${ride.id}` } });
      return;
    }
    if (isDriver) {
      setError("Driver accounts cannot book rides. Please login as a passenger to book.");
      return;
    }
    setMessage("");
    setError("");
    if (!pickup || !drop) {
      setError("Please select pickup and drop points before booking.");
      return;
    }
    const passengerValidationError = validatePassengerEntries(seatEntries, savedPassengers ?? []);
    if (passengerValidationError) {
      setError(passengerValidationError);
      return;
    }
    // Build one passenger per seat from the form, resolving saved selections.
    const passengers: PassengerInput[] = [];
    for (let i = 0; i < seatEntries.length; i += 1) {
      const entry = seatEntries[i];
      if (entry.savedId && entry.savedId !== "new") {
        const sp = savedPassengers?.find((p) => String(p.id) === entry.savedId);
        if (!sp) {
          setError(`Select a passenger for seat ${i + 1}.`);
          return;
        }
        passengers.push({ full_name: sp.full_name, age: sp.age, gender: sp.gender, phone: sp.phone });
      } else {
        if (!entry.full_name.trim()) {
          setError(`Enter the name for passenger ${i + 1}.`);
          return;
        }
        passengers.push({
          full_name: entry.full_name.trim(),
          age: entry.age ? Number(entry.age) : null,
          gender: entry.gender || null,
          save: entry.save
        });
      }
    }
    setPaying(true);
    try {
      const data = await bookingsApi.book(ride.id, {
        seats_booked: seats,
        pickup_point: pickup,
        drop_point: drop,
        payment_method: paymentMethod,
        passengers
      });
      if (data.payment) {
        await payWithRazorpay(data);
      } else {
        navigate("/booking-confirmation", { state: { bookingCode: data.booking.booking_code, status: data.booking.status, paymentMethod: "cash" } });
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Could not book the ride. Please try again."));
    } finally {
      setPaying(false);
    }
  }

  async function payWithRazorpay(data: BookingActionResponse) {
    const init = data.payment!;
    const ready = await loadRazorpayCheckout();
    if (!ready) {
      setError("Could not load the payment window. Check your connection and try again.");
      return;
    }
    const rzp = new (window as any).Razorpay({
      key: init.razorpay_key_id,
      amount: init.amount,
      currency: init.currency,
      order_id: init.razorpay_order_id,
      name: "Carthi",
      description: `Booking ${init.booking_code}`,
      prefill: { name: me?.full_name, contact: me?.whatsapp_number ?? "" },
      theme: { color: "#171717" },
      handler: async (resp: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const confirmed = await bookingsApi.verifyPayment({
            booking_id: data.booking.id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature
          });
          navigate("/booking-confirmation", { state: { bookingCode: confirmed.booking_code, status: confirmed.status, paymentMethod: "online" } });
        } catch (err) {
          setError(apiErrorMessage(err, "Payment could not be verified. If money was deducted it will be refunded."));
        }
      },
      modal: {
        ondismiss: () => setError("Payment cancelled. Your seats are held briefly - try again to confirm.")
      }
    });
    rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
      setError(resp.error?.description || "Payment failed. Please try again.");
    });
    rzp.open();
  }

  if (!ride) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="alert-info">Loading ride details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-6">
      <div className="card rounded-2xl p-4 md:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold md:text-2xl">
                  {ride.source_city} to {ride.destination_city}
                </h1>
                <StatusChip label={rideStateLabel(ride)} />
                {ride.women_only_preference && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs font-bold text-pink-600">
                    <UserRound size={12} />
                    Women only
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {formatShortDate(ride.journey_date)} · {formatTimeAmPm(ride.departure_time)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg bg-primary-soft px-3 py-2">
                <p className="text-[11px] font-bold text-primary">Date</p>
                <p className="text-sm font-bold text-primary-dark">{formatShortDate(ride.journey_date)}</p>
              </div>
              <div className="rounded-lg bg-primary-soft px-3 py-2">
                <p className="text-[11px] font-bold text-primary">Time</p>
                <p className="text-sm font-bold text-primary-dark">{formatTimeAmPm(ride.departure_time)}</p>
              </div>
              <div className="rounded-lg bg-primary-soft px-3 py-2">
                <p className="text-[11px] font-bold text-primary">Price per seat</p>
                <p className="text-sm font-bold text-primary-dark">Rs. {ride.price_per_seat}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
            <div className="flex flex-col gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="card p-3.5 shadow-none">
                  <h3 className="text-sm font-bold">Driver</h3>
                  <p className="mt-0.5 text-sm text-muted">
                    {ride.driver_name} · {ride.driver_rating} rating
                  </p>
                </div>
                <div className="card p-3.5 shadow-none">
                  <h3 className="text-sm font-bold">
                    Car details · <span className="font-normal text-muted">{ride.vehicle.brand} {ride.vehicle.model}</span>
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="chip">
                      <Car size={12} />
                      {ride.vehicle.car_type}
                    </span>
                    <span className="chip-outline">
                      <Palette size={12} />
                      {ride.vehicle.color}
                    </span>
                    <span className="chip-outline">
                      <Hash size={12} />
                      {ride.vehicle.vehicle_number}
                    </span>
                    <span className="chip-outline">
                      <Fuel size={12} />
                      {ride.vehicle.fuel_type}
                    </span>
                    <span className="chip-outline">{ride.ac_available ? "AC" : "Non-AC"}</span>
                  </div>
                </div>
              </div>

              <div className="card p-3.5 shadow-none">
                <h3 className="text-sm font-bold">Pickup, stops, and drop points</h3>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {[
                    ["Pickup", ride.pickup_points.join(", ")],
                    ["In-between stops", ride.route_stops.length ? ride.route_stops.join(", ") : "No stops added"],
                    ["Drop", ride.drop_points.join(", ")]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-cream p-2.5">
                      <p className="text-[11px] font-bold text-muted">{label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-3.5 shadow-none">
                <h3 className="text-sm font-bold">Ride instructions</h3>
                <div className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {instructionLines.map((instruction) => (
                    <div key={instruction} className="flex items-center gap-2">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <p className="text-xs">{instruction}</p>
                    </div>
                  ))}
                </div>
                {ride.route_notes && <p className="mt-2 text-xs text-muted">Route note: {ride.route_notes}</p>}
              </div>

              {(isViewOnly || Boolean(fellowPassengers?.length)) && (
                <div className="card p-3.5 shadow-none">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-primary" />
                    <h3 className="text-sm font-bold">Booked passengers ({fellowPassengers?.length ?? 0})</h3>
                  </div>
                  {fellowPassengers?.length ? (
                    <div className="mt-2 flex flex-col gap-2">
                    {fellowPassengers.map((p, i) => (
                      <div
                        key={`${p.name}-${p.pickup_point}-${p.drop_point}-${i}`}
                        className="flex flex-col gap-1 rounded-lg bg-cream px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-bold">{p.name}</span>
                        <span className="text-muted">{p.pickup_point} → {p.drop_point}</span>
                        {p.seats_booked > 1 && <span className="chip self-start sm:self-center">{p.seats_booked} seats</span>}
                      </div>
                    ))}
                    </div>
                  ) : (
                    <p className="alert-info mt-2">No passengers have booked this ride yet.</p>
                  )}
                </div>
              )}
            </div>

            {!isViewOnly && (
              <div className="card self-start p-3.5 shadow-none lg:sticky lg:top-24">
                <h2 className="text-base font-bold">Book this ride</h2>
                <p className="mt-0.5 text-xs text-muted">Choose seats, pickup, and a final drop or in-between stop.</p>
                <div className="mt-3 flex flex-col gap-2.5">
                  {isDriver ? (
                    <p className="alert-warning">Driver accounts cannot book rides. Login as a passenger to book a seat.</p>
                  ) : (
                    <>
                    <select
                      className="input"
                      value={seats}
                      onChange={(event) => setSeats(Number(event.target.value))}
                    >
                      {Array.from({ length: Math.max(1, ride.available_seats) }, (_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1} passenger{index + 1 > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <PassengerSeats
                      entries={seatEntries}
                      onChange={setSeatEntries}
                      savedPassengers={savedPassengers ?? []}
                    />
                    <select className="input" value={pickup} onChange={(event) => setPickup(event.target.value)}>
                      <option value="">Select pickup</option>
                      {ride.pickup_points.map((point) => (
                        <option key={point} value={point}>
                          {point}
                        </option>
                      ))}
                    </select>
                    <select className="input" value={drop} onChange={(event) => setDrop(event.target.value)}>
                      <option value="">Select drop-off or stop</option>
                      {ride.route_stops.length > 0 && (
                        <optgroup label="In-between stops">
                          {ride.route_stops.map((point) => (
                            <option key={point} value={point}>
                              {point}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="Final drop points">
                        {ride.drop_points.map((point) => (
                          <option key={point} value={point}>
                            {point}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                    <div>
                      <span className="field-label">Payment method</span>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cash")}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition ${
                            paymentMethod === "cash"
                              ? "border-primary bg-primary-soft text-primary-dark"
                              : "border-gray-200 text-muted"
                          }`}
                        >
                          <Banknote size={14} />
                          Pay by cash
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("online")}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-bold transition ${
                            paymentMethod === "online"
                              ? "border-primary bg-primary-soft text-primary-dark"
                              : "border-gray-200 text-muted"
                          }`}
                        >
                          <CreditCard size={14} />
                          Pay online
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {paymentMethod === "cash"
                          ? "Pay the driver in cash at the end of the ride."
                          : "Pay now via UPI, card, or netbanking. Seat is confirmed after payment."}
                      </p>
                    </div>
                    {missingContactNumber && (
                      <p className="alert-warning">
                        A WhatsApp contact number is required to book.{" "}
                        <Link to="/profile" className="font-bold underline">
                          Add it in My Profile
                        </Link>{" "}
                        first.
                      </p>
                    )}
                    {ride.available_seats <= 0 ? (
                      <p className="alert-warning">This ride is full. No seats remaining.</p>
                    ) : (
                      <button type="button" className="btn-primary py-2" onClick={book} disabled={missingContactNumber || paying || !pickup || !drop}>
                        {paymentMethod === "online" ? <CreditCard size={16} /> : <MessageCircle size={16} />}
                        {paying ? "Processing..." : `${paymentMethod === "online" ? "Pay & book" : "Book ride"} · Rs. ${paymentAmount}`}
                      </button>
                    )}
                    <p className="text-xs text-muted">
                      {ride.available_seats} seats remaining. WhatsApp details are shared after confirmation.
                    </p>
                    </>
                  )}
                  {message && <p className="alert-success">{message}</p>}
                  {error && <p className="alert-error">{error}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
