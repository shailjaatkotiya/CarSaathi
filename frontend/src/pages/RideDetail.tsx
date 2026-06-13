import { AlertTriangle, Banknote, Car, CreditCard, Fuel, MessageCircle, Share2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, BookingActionResponse, loadRazorpayCheckout, Ride, User } from "../api/client";
import VerifiedBadge from "../components/VerifiedBadge";
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
  const [seats, setSeats] = useState(1);
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const token = useSessionStore((state) => state.token);
  const navigate = useNavigate();
  const { data: ride, refetch } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => (await api.get<Ride>(`/passenger/rides/${rideId}`)).data
  });
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token)
  });
  const missingContactNumber = Boolean(me) && !me?.whatsapp_number?.trim();

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
      navigate("/auth", { state: { from: `/rides/${ride.id}` } });
      return;
    }
    setMessage("");
    setError("");
    setPaying(true);
    try {
      const { data } = await api.post<BookingActionResponse>(`/passenger/rides/${ride.id}/book`, {
        seats_booked: seats,
        pickup_point: pickup || ride.pickup_points[0],
        drop_point: drop || ride.drop_points[0],
        payment_method: paymentMethod
      });
      if (data.payment) {
        await payWithRazorpay(data);
      } else {
        setMessage(`Booking ${data.booking.booking_code} created (${data.booking.status}). Pay cash to the driver at the end of the ride.`);
      }
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not book the ride. Please try again.");
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
      theme: { color: "#0f766e" },
      handler: async (resp: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const { data: confirmed } = await api.post("/passenger/payments/verify", {
            booking_id: data.booking.id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature
          });
          setMessage(`Payment successful. Booking ${confirmed.booking_code} is ${confirmed.status}.`);
        } catch (err) {
          const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
          setError(detail || "Payment could not be verified. If money was deducted it will be refunded.");
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
                <VerifiedBadge verified={ride.driver_verified} />
              </div>
              <p className="mt-0.5 text-sm text-muted">
                {ride.distance_km} km · {ride.journey_date} · {ride.departure_time.slice(0, 5)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-lg bg-primary-soft px-3 py-2">
                <p className="text-[11px] font-bold text-primary">Date</p>
                <p className="text-sm font-bold text-primary-dark">{ride.journey_date}</p>
              </div>
              <div className="rounded-lg bg-primary-soft px-3 py-2">
                <p className="text-[11px] font-bold text-primary">Time</p>
                <p className="text-sm font-bold text-primary-dark">{ride.departure_time.slice(0, 5)}</p>
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

              <div className="flex flex-wrap gap-1.5">
                <span className="chip-solid">
                  <ShieldCheck size={12} />
                  Verified badge
                </span>
                <span className="chip-outline">
                  <AlertTriangle size={12} />
                  Report user option
                </span>
                <span className="chip-outline">
                  <Share2 size={12} />
                  Ride sharing link
                </span>
              </div>
            </div>

            <div className="card self-start p-3.5 shadow-none lg:sticky lg:top-24">
              <h2 className="text-base font-bold">Book this ride</h2>
              <p className="mt-0.5 text-xs text-muted">Choose seats, pickup, and a final drop or in-between stop.</p>
              <div className="mt-3 flex flex-col gap-2.5">
                <label>
                  <span className="field-label">Seats</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={ride.available_seats}
                    value={seats}
                    onChange={(event) => setSeats(Number(event.target.value))}
                  />
                </label>
                <label>
                  <span className="field-label">Pickup</span>
                  <select className="input" value={pickup} onChange={(event) => setPickup(event.target.value)}>
                    <option value="">Select pickup</option>
                    {ride.pickup_points.map((point) => (
                      <option key={point} value={point}>
                        {point}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">Drop-off or stop</span>
                  <select className="input" value={drop} onChange={(event) => setDrop(event.target.value)}>
                    <option value="">Select drop</option>
                    {ride.route_stops.map((point) => (
                      <option key={point} value={point}>
                        {point} (in-between stop)
                      </option>
                    ))}
                    {ride.drop_points.map((point) => (
                      <option key={point} value={point}>
                        {point}
                      </option>
                    ))}
                  </select>
                </label>
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
                <button type="button" className="btn-primary py-2" onClick={book} disabled={missingContactNumber || paying}>
                  {paymentMethod === "online" ? <CreditCard size={16} /> : <MessageCircle size={16} />}
                  {paying ? "Processing..." : `${paymentMethod === "online" ? "Pay & book" : "Book ride"} · Rs. ${paymentAmount}`}
                </button>
                <p className="text-xs text-muted">
                  {ride.available_seats} seats remaining. WhatsApp details are shared after confirmation.
                </p>
                {message && <p className="alert-success">{message}</p>}
                {error && <p className="alert-error">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
