import { Car, CalendarCheck, ListChecks, Route as RouteIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, User } from "../api/client";
import { useSessionStore } from "../store/session";

const rideRules = [
  { value: "no_pets", label: "No pets" },
  { value: "no_extra_children", label: "No extra children" },
  { value: "no_music", label: "No music" },
  { value: "no_smoking", label: "No smoking" },
  { value: "no_alcohol", label: "No alcohol" },
  { value: "no_tobacco", label: "No tobacco" }
];

const defaultRuleValues = ["no_pets", "no_smoking", "no_alcohol", "no_tobacco"];

type CarMode = "profile" | "new" | "skip";

const carModeOptions: { value: CarMode; label: string; hint: string }[] = [
  { value: "profile", label: "Use car from my profile", hint: "Reuse the personal car saved in your profile" },
  { value: "new", label: "Add new car", hint: "Type fresh car details for this ride" },
  { value: "skip", label: "Skip for now", hint: "Publish without car details and add them later" }
];

function formatRuleLabel(value: string) {
  return rideRules.find((rule) => rule.value === value)?.label ?? value.replace(/_/g, " ");
}

function FormSection({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="card p-5 shadow-none md:p-6">
      <div className="flex items-start gap-3">
        <span className="icon-tile">{icon}</span>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function CreateRide() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [carMode, setCarMode] = useState<CarMode>("new");
  const [selectedRules, setSelectedRules] = useState(defaultRuleValues);
  const token = useSessionStore((state) => state.token);
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token)
  });
  const profileCar =
    me && (me.personal_car_brand || me.personal_car_model || me.personal_car_number)
      ? {
          brand: me.personal_car_brand || "",
          model: me.personal_car_model || "",
          number: me.personal_car_number || "",
          fuel: me.personal_car_fuel_type || "",
          category: me.personal_car_category || ""
        }
      : null;
  const [extraInstructions, setExtraInstructions] = useState("Please be on time. Call before reaching pickup point.");
  const defaultRideDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const instructionText = [
    ...selectedRules.map((rule) => `- ${formatRuleLabel(rule)}`),
    ...extraInstructions
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `- ${line.replace(/^-+\s*/, "")}`)
  ].join("\n");

  function toggleRule(value: string, checked: boolean) {
    setSelectedRules((current) => {
      if (checked) return current.includes(value) ? current : [...current, value];
      return current.filter((rule) => rule !== value);
    });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const pickupPoints = String(payload.pickup_points).split(",").map((item) => item.trim()).filter(Boolean);
    const dropPoints = String(payload.drop_points).split(",").map((item) => item.trim()).filter(Boolean);

    if (pickupPoints.length < 5 || dropPoints.length < 5) {
      setError("Please add minimum 5 pickup points and 5 drop points before publishing.");
      return;
    }

    const carDetails =
      carMode === "profile" && profileCar
        ? {
            car_brand: profileCar.brand || null,
            car_model: profileCar.model || null,
            vehicle_number: profileCar.number || null,
            fuel_type: profileCar.fuel || null,
            car_type: profileCar.category || null
          }
        : carMode === "new"
        ? {
            car_brand: String(payload.car_brand ?? "").trim() || null,
            car_model: String(payload.car_model ?? "").trim() || null,
            vehicle_number: String(payload.vehicle_number ?? "").trim() || null,
            fuel_type: payload.fuel_type || null,
            car_type: payload.car_type || null
          }
        : {};

    try {
      const { data } = await api.post("/driver/rides", {
        ...carDetails,
        source_city: payload.source_city,
        destination_city: payload.destination_city,
        distance_km: Number(payload.distance_km),
        journey_date: payload.journey_date,
        departure_time: payload.departure_time,
        available_seats: Number(payload.available_seats),
        price_per_seat: Number(payload.price_per_seat),
        pickup_points: pickupPoints,
        drop_points: dropPoints,
        route_stops: String(payload.route_stops).split(",").map((item) => item.trim()).filter(Boolean),
        ride_rules: selectedRules,
        driver_instructions: instructionText,
        route_notes: payload.route_notes,
        luggage_allowance: payload.luggage_allowance,
        smoking_allowed: !selectedRules.includes("no_smoking"),
        ac_available: true,
        women_only_preference: false
      });
      setMessage(`Ride published successfully as demo listing #${data.id}.`);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not publish the ride. Please check the backend is running and try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <form onSubmit={submit} className="flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold md:text-5xl">Driver - Publish New Ride</h1>
          <p className="mt-2 max-w-3xl text-muted">
            Fill the labelled fields below. Car details are optional: use the car saved in your profile, add a new one,
            or skip and publish without them.
          </p>
        </div>
        <p className="alert-info">
          Conditions: publish only 3 hours to 10 days before departure. Minimum 5 pickup points and 5 drop points are
          required.
        </p>

        <FormSection title="Car details" subtitle="Pick your profile car, add a new one, or skip and publish without car details." icon={<Car size={20} />}>
          <div className="grid gap-3 sm:grid-cols-3">
            {carModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCarMode(option.value)}
                className={`rounded-xl border p-4 text-left transition ${
                  carMode === option.value
                    ? "border-primary bg-primary text-white"
                    : "border-sand bg-cream text-ink hover:border-primary"
                }`}
              >
                <p className="font-bold">{option.label}</p>
                <p className="mt-1 text-xs">{option.hint}</p>
              </button>
            ))}
          </div>

          {carMode === "profile" && (
            <div className="mt-4">
              {profileCar ? (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-xl border border-sand bg-white p-4">
                    <p className="text-xs font-bold text-muted">Car</p>
                    <p className="mt-1.5 font-bold">{[profileCar.brand, profileCar.model].filter(Boolean).join(" ") || "Not added"}</p>
                  </div>
                  <div className="rounded-xl border border-sand bg-white p-4">
                    <p className="text-xs font-bold text-muted">Vehicle number</p>
                    <p className="mt-1.5 font-bold">{profileCar.number || "Not added"}</p>
                  </div>
                  <div className="rounded-xl border border-sand bg-white p-4">
                    <p className="text-xs font-bold text-muted">Fuel and category</p>
                    <p className="mt-1.5 font-bold">{[profileCar.fuel, profileCar.category].filter(Boolean).join(" · ") || "Not added"}</p>
                  </div>
                </div>
              ) : (
                <p className="alert-warning">
                  No personal car is saved in your profile{token ? "" : " (login required)"}.{" "}
                  <Link to="/profile" className="font-bold underline">
                    Add it in My Profile
                  </Link>{" "}
                  or pick another option. Publishing still works without car details.
                </p>
              )}
            </div>
          )}

          {carMode === "new" && (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label>
                <span className="field-label">Car brand</span>
                <input className="input" name="car_brand" defaultValue="Maruti Suzuki" />
                <span className="field-hint">Example: Maruti Suzuki, Hyundai</span>
              </label>
              <label>
                <span className="field-label">Car model</span>
                <input className="input" name="car_model" defaultValue="Swift Dzire" />
                <span className="field-hint">Example: Swift Dzire, Creta</span>
              </label>
              <label>
                <span className="field-label">Vehicle number</span>
                <input className="input" name="vehicle_number" defaultValue="GJ01AB1234" />
                <span className="field-hint">Shown after confirmed booking</span>
              </label>
              <label>
                <span className="field-label">Fuel type</span>
                <select className="input" name="fuel_type" defaultValue="Petrol">
                  <option value="Petrol">Petrol</option>
                  <option value="CNG">CNG</option>
                  <option value="EV">EV</option>
                  <option value="Diesel">Diesel</option>
                </select>
                <span className="field-hint">Petrol, CNG, EV, or Diesel</span>
              </label>
              <label>
                <span className="field-label">Car category</span>
                <select className="input" name="car_type" defaultValue="Sedan">
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="7 Seater">7 Seater</option>
                </select>
                <span className="field-hint">Choose SUV, Sedan, or 7 Seater</span>
              </label>
            </div>
          )}

          {carMode === "skip" && (
            <p className="alert-info mt-4">
              Ride will publish without car details. You can add the car later from My Profile or the Add Vehicle page.
            </p>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label>
              <span className="field-label">Available seats</span>
              <input className="input" name="available_seats" defaultValue="3" />
              <span className="field-hint">Seats passengers can book</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Ride route and timing" subtitle="Set the final route, date, time, and recoverable seat price." icon={<CalendarCheck size={20} />}>
          <div className="grid gap-4 md:grid-cols-3">
            <label>
              <span className="field-label">Source city</span>
              <input className="input" name="source_city" defaultValue="Rajkot" />
              <span className="field-hint">Main city where ride starts</span>
            </label>
            <label>
              <span className="field-label">Destination city</span>
              <input className="input" name="destination_city" defaultValue="Jamnagar" />
              <span className="field-hint">Final city where ride ends</span>
            </label>
            <label>
              <span className="field-label">Distance in km</span>
              <input className="input" name="distance_km" defaultValue="96" />
              <span className="field-hint">Approx route distance</span>
            </label>
            <label>
              <span className="field-label">Journey date</span>
              <input className="input" name="journey_date" type="date" defaultValue={defaultRideDate} />
              <span className="field-hint">Maximum 10 days ahead</span>
            </label>
            <label>
              <span className="field-label">Departure time</span>
              <input className="input" name="departure_time" type="time" defaultValue="07:30" />
              <span className="field-hint">Minimum 3 hours from now</span>
            </label>
            <label>
              <span className="field-label">Price per seat</span>
              <input className="input" name="price_per_seat" defaultValue="180" />
              <span className="field-hint">Passenger pays this amount per seat</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Pickup, stops, and drop points" subtitle="Use comma-separated local points. Passengers can pick from these." icon={<RouteIcon size={20} />}>
          <div className="flex flex-col gap-4">
            <label>
              <span className="field-label">Pickup points - minimum 5</span>
              <textarea
                className="input"
                name="pickup_points"
                rows={2}
                defaultValue="Rajkot Bus Stand, Kalawad Road, Gondal Road, University Road, Mavdi Circle"
              />
              <span className="field-hint">Example: Bopal, Gota, Iscon. Separate each point with comma.</span>
            </label>
            <label>
              <span className="field-label">In-between stops</span>
              <textarea className="input" name="route_stops" rows={2} defaultValue="Dhrol, Reliance Circle" />
              <span className="field-hint">Stops passengers can choose before final destination.</span>
            </label>
            <label>
              <span className="field-label">Drop points - minimum 5</span>
              <textarea
                className="input"
                name="drop_points"
                rows={2}
                defaultValue="Jamnagar Bus Stand, Patel Colony, Reliance Circle, Digjam Circle, Railway Station"
              />
              <span className="field-hint">Final city drop points. Separate each point with comma.</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Passenger instructions" subtitle="Clear rules reduce friction before booking." icon={<ListChecks size={20} />}>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {rideRules.map((rule) => (
              <label key={rule.value} className="flex cursor-pointer items-center gap-2 rounded-xl border border-sand p-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedRules.includes(rule.value)}
                  onChange={(event) => toggleRule(rule.value, event.target.checked)}
                />
                {rule.label}
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <label>
              <span className="field-label">Extra driver instructions</span>
              <textarea
                className="input"
                rows={2}
                value={extraInstructions}
                onChange={(event) => setExtraInstructions(event.target.value)}
              />
              <span className="field-hint">Add any extra note passengers must read before booking.</span>
            </label>
            <label>
              <span className="field-label">Instructions field shown to passengers</span>
              <textarea className="input" name="driver_instructions_preview" rows={5} value={instructionText} readOnly />
              <span className="field-hint">Selected passenger instruction pointers are added here as bullet points.</span>
            </label>
          </div>
        </FormSection>

        <FormSection title="Other ride details" subtitle="Help passengers understand luggage and route expectations." icon={<RouteIcon size={20} />}>
          <div className="grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Luggage allowance</span>
              <input className="input" name="luggage_allowance" defaultValue="One cabin bag" />
              <span className="field-hint">Example: One cabin bag per passenger</span>
            </label>
            <label>
              <span className="field-label">Route notes</span>
              <textarea className="input" name="route_notes" rows={2} defaultValue="Short route with one optional water break." />
              <span className="field-hint">Example: halt, route preference, road condition</span>
            </label>
          </div>
        </FormSection>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button className="btn-primary px-6 py-3 text-base" type="submit">
            Publish New Ride
          </button>
          {message && <p className="alert-success">{message}</p>}
          {error && <p className="alert-error">{error}</p>}
        </div>
      </form>
    </div>
  );
}
