import { AlertTriangle, Car, Fuel, MessageCircle, Share2, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Ride } from "../api/client";
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
  const [message, setMessage] = useState("");
  const token = useSessionStore((state) => state.token);
  const navigate = useNavigate();
  const { data: ride } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: async () => (await api.get<Ride>(`/passenger/rides/${rideId}`)).data
  });

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
    const { data } = await api.post(`/passenger/rides/${ride.id}/book`, {
      seats_booked: seats,
      pickup_point: pickup || ride.pickup_points[0],
      drop_point: drop || ride.drop_points[0]
    });
    setMessage(`Booking ${data.booking_code} created with ${data.status} status.`);
  }

  if (!ride) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <p className="alert-info">Loading ride details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="card rounded-3xl p-5 md:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold md:text-5xl">
                  {ride.source_city} to {ride.destination_city}
                </h1>
                <VerifiedBadge verified={ride.driver_verified} />
              </div>
              <p className="mt-2 text-muted">
                {ride.distance_km} km · {ride.journey_date} · {ride.departure_time.slice(0, 5)}
              </p>
            </div>
            <div className="min-w-[170px] rounded-xl bg-primary-soft p-4">
              <p className="text-xs font-bold text-primary">Price per seat</p>
              <p className="text-3xl font-bold text-primary-dark">Rs. {ride.price_per_seat}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="flex flex-col gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="card p-5 shadow-none">
                  <h3 className="font-bold">Driver</h3>
                  <p className="mt-1 text-muted">
                    {ride.driver_name} · {ride.driver_rating} rating
                  </p>
                </div>
                <div className="card p-5 shadow-none">
                  <h3 className="font-bold">Car details</h3>
                  <p className="mt-1 text-muted">
                    {ride.vehicle.brand} {ride.vehicle.model}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip">
                      <Car size={14} />
                      {ride.vehicle.car_type}
                    </span>
                    <span className="chip-outline">
                      <Fuel size={14} />
                      {ride.vehicle.fuel_type}
                    </span>
                    <span className="chip-outline">{ride.ac_available ? "AC" : "Non-AC"}</span>
                  </div>
                </div>
              </div>

              <div className="card p-5 shadow-none">
                <h3 className="font-bold">Pickup, stops, and drop points</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {[
                    ["Pickup", ride.pickup_points.join(", ")],
                    ["In-between stops", ride.route_stops.length ? ride.route_stops.join(", ") : "No stops added"],
                    ["Drop", ride.drop_points.join(", ")]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-cream p-4">
                      <p className="text-xs font-bold text-muted">{label}</p>
                      <p className="mt-1.5 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 shadow-none">
                <h3 className="font-bold">Driver instructions</h3>
                <div className="mt-4 flex flex-col gap-2">
                  {instructionLines.map((instruction) => (
                    <div key={instruction} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <p className="text-sm">{instruction}</p>
                    </div>
                  ))}
                </div>
                {ride.route_notes && <p className="mt-4 text-sm text-muted">Route note: {ride.route_notes}</p>}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="chip-solid">
                  <ShieldCheck size={14} />
                  Verified badge
                </span>
                <span className="chip-outline">
                  <AlertTriangle size={14} />
                  Report user option
                </span>
                <span className="chip-outline">
                  <Share2 size={14} />
                  Ride sharing link
                </span>
              </div>
            </div>

            <div className="card self-start p-5 shadow-none lg:sticky lg:top-24">
              <h2 className="text-xl font-bold">Book this ride</h2>
              <p className="mt-1.5 text-sm text-muted">Choose seats, pickup, and a final drop or in-between stop.</p>
              <div className="mt-5 flex flex-col gap-4">
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
                <button type="button" className="btn-primary py-3" onClick={book}>
                  <MessageCircle size={18} />
                  Book ride · Rs. {paymentAmount}
                </button>
                <hr className="border-sand" />
                <p className="text-sm text-muted">
                  {ride.available_seats} seats available. WhatsApp details are shared after confirmation.
                </p>
                {message && <p className="alert-success">{message}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
