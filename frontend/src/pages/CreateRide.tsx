import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarCheck,
  Car,
  CheckCircle2,
  ListChecks,
  MapPin,
  Map as MapIcon,
  Route as RouteIcon,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, User } from "../api/client";
import TravelDatePicker, { clampTravelDate } from "../components/TravelDatePicker";
import { carBrands } from "../data/carBrands";
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

type CarMode = "profile" | "saved" | "new";

const carModeOptions: { value: CarMode; label: string; hint: string }[] = [
  { value: "profile", label: "Car from my profile", hint: "Reuse the personal car saved in your profile" },
  { value: "saved", label: "A saved vehicle", hint: "Choose one of the vehicles you added earlier" },
  { value: "new", label: "Add a new car", hint: "Type fresh car details for this ride" }
];

type SavedVehicle = {
  id: number;
  brand: string;
  model: string;
  vehicle_number: string;
  fuel_type: string;
  car_type: string;
  seats: number;
};

function formatRuleLabel(value: string) {
  return rideRules.find((rule) => rule.value === value)?.label ?? value.replace(/_/g, " ");
}

function defaultAvailableSeats(carType?: string | null) {
  return carType?.toLowerCase().includes("7") ? 6 : 3;
}

function countPoints(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean).length;
}

// One step shell: title, subtitle, icon, and the step's fields. Same on every
// viewport - a single centred column so desktop and mobile match exactly.
function StepShell({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="card p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="icon-tile">{icon}</span>
        <div>
          <h2 className="text-lg font-bold md:text-xl">{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function CreateRide() {
  const token = useSessionStore((state) => state.token);
  const defaultRideDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // All fields are controlled so values survive while steps mount/unmount.
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [sourceCity, setSourceCity] = useState("Rajkot");
  const [destinationCity, setDestinationCity] = useState("Jamnagar");
  const [distanceKm, setDistanceKm] = useState("96");
  const [journeyDate, setJourneyDate] = useState(clampTravelDate(defaultRideDate));
  const [departureTime, setDepartureTime] = useState("07:30");
  const [pricePerSeat, setPricePerSeat] = useState("180");

  const [pickupPoints, setPickupPoints] = useState("Rajkot Bus Stand, Kalawad Road, Gondal Road, University Road, Mavdi Circle");
  const [routeStops, setRouteStops] = useState("Dhrol, Reliance Circle");
  const [dropPoints, setDropPoints] = useState("Jamnagar Bus Stand, Patel Colony, Reliance Circle, Digjam Circle, Railway Station");

  const [carMode, setCarMode] = useState<CarMode>("new");
  const [newCarBrand, setNewCarBrand] = useState("Maruti Suzuki");
  const [newCarBrandOther, setNewCarBrandOther] = useState("");
  const [carModel, setCarModel] = useState("Swift Dzire");
  const [vehicleNumber, setVehicleNumber] = useState("GJ01AB1234");
  const [fuelType, setFuelType] = useState("Petrol");
  const [carColor, setCarColor] = useState("White");
  const [newCarType, setNewCarType] = useState("Sedan");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [availableSeats, setAvailableSeats] = useState(3);

  const [selectedRules, setSelectedRules] = useState(defaultRuleValues);
  const [extraInstructions, setExtraInstructions] = useState("Please be on time. Call before reaching pickup point.");
  const [luggageAllowance, setLuggageAllowance] = useState("One cabin bag");
  const [routeNotes, setRouteNotes] = useState("Short route with one optional water break.");
  const [autoConfirm, setAutoConfirm] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<User>("/auth/me")).data,
    enabled: Boolean(token)
  });
  const { data: savedVehicles } = useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => (await api.get<SavedVehicle[]>("/driver/vehicles")).data,
    enabled: Boolean(token)
  });

  const profileCar =
    me &&
    (me.personal_car_brand ||
      me.personal_car_model ||
      me.personal_car_number ||
      me.personal_car_fuel_type ||
      me.personal_car_category ||
      me.personal_car_seats)
      ? {
          brand: me.personal_car_brand || "",
          model: me.personal_car_model || "",
          number: me.personal_car_number || "",
          fuel: me.personal_car_fuel_type || "",
          category: me.personal_car_category || "",
          color: me.personal_car_color || "White",
          seats: me.personal_car_seats || null
        }
      : null;
  const profileCarComplete = Boolean(
    profileCar?.brand && profileCar.model && profileCar.number && profileCar.fuel && profileCar.category
  );
  const selectedVehicle = savedVehicles?.find((vehicle) => vehicle.id === selectedVehicleId);
  const selectedCarType =
    carMode === "saved" ? selectedVehicle?.car_type : carMode === "profile" ? profileCar?.category : newCarType;
  const maxAvailableSeats = defaultAvailableSeats(selectedCarType);
  const resolvedNewBrand = newCarBrand === "Other" ? newCarBrandOther.trim() : newCarBrand;

  useEffect(() => {
    setAvailableSeats(defaultAvailableSeats(selectedCarType));
  }, [selectedCarType]);

  const instructionText = useMemo(
    () =>
      [
        ...selectedRules.map((rule) => `- ${formatRuleLabel(rule)}`),
        ...extraInstructions
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `- ${line.replace(/^-+\s*/, "")}`)
      ].join("\n"),
    [selectedRules, extraInstructions]
  );

  function toggleRule(value: string, checked: boolean) {
    setSelectedRules((current) => {
      if (checked) return current.includes(value) ? current : [...current, value];
      return current.filter((rule) => rule !== value);
    });
  }

  const missingWhatsapp = Boolean(me) && !me?.whatsapp_number?.trim();

  // Steps in order. Map step is intentionally an empty placeholder for a later
  // iteration. Validate returns an error string (or null) before advancing.
  const steps = [
    {
      key: "route",
      title: "Where are you going?",
      subtitle: "Set the cities your ride connects.",
      icon: <RouteIcon size={20} />,
      validate: () => {
        if (!sourceCity.trim() || !destinationCity.trim()) return "Enter both source and destination city.";
        if (!Number(distanceKm) || Number(distanceKm) <= 0) return "Enter a valid route distance in km.";
        return null;
      }
    },
    {
      key: "map",
      title: "Pin pickup & drop on map",
      subtitle: "Map selection arrives in a later update - skip for now.",
      icon: <MapIcon size={20} />,
      validate: () => null
    },
    {
      key: "datetime",
      title: "When do you leave?",
      subtitle: "Pick the journey date and departure time.",
      icon: <CalendarCheck size={20} />,
      validate: () => {
        if (!journeyDate) return "Choose a journey date.";
        if (!departureTime) return "Choose a departure time.";
        return null;
      }
    },
    {
      key: "points",
      title: "Pickup, stops & drop points",
      subtitle: "Add at least 5 pickup and 5 drop points, comma separated.",
      icon: <MapPin size={20} />,
      validate: () => {
        if (countPoints(pickupPoints) < 5) return "Add minimum 5 pickup points.";
        if (countPoints(dropPoints) < 5) return "Add minimum 5 drop points.";
        return null;
      }
    },
    {
      key: "car",
      title: "Which car will you drive?",
      subtitle: "Use your profile car, a saved vehicle, or add a new one.",
      icon: <Car size={20} />,
      validate: () => {
        if (carMode === "profile" && !profileCarComplete) return "Complete your profile car (brand, model, number, fuel, category) first.";
        if (carMode === "saved" && !selectedVehicleId) return "Select one of your saved vehicles.";
        if (carMode === "new") {
          if (!resolvedNewBrand || !carModel.trim() || !vehicleNumber.trim() || !fuelType.trim() || !newCarType.trim())
            return "Enter complete car details (brand, model, number, fuel, category).";
        }
        return null;
      }
    },
    {
      key: "seatsprice",
      title: "Seats & price",
      subtitle: "How many seats and what each passenger pays.",
      icon: <Banknote size={20} />,
      validate: () => {
        if (availableSeats < 1) return "Offer at least 1 seat.";
        if (availableSeats > maxAvailableSeats) return `${selectedCarType || "This car"} can publish up to ${maxAvailableSeats} seats.`;
        if (!Number(pricePerSeat) || Number(pricePerSeat) < 1) return "Enter a valid price per seat.";
        return null;
      }
    },
    {
      key: "rules",
      title: "Ride rules & instructions",
      subtitle: "Set expectations so booking is smooth.",
      icon: <ListChecks size={20} />,
      validate: () => null
    },
    {
      key: "booking",
      title: "Booking & extras",
      subtitle: "Instant booking, luggage, and route notes.",
      icon: <Zap size={20} />,
      validate: () => null
    },
    {
      key: "review",
      title: "Review & publish",
      subtitle: "Check everything before going live.",
      icon: <CheckCircle2 size={20} />,
      validate: () => null
    }
  ];

  const lastStep = steps.length - 1;
  const current = steps[step];

  function goNext() {
    setError("");
    const stepError = current.validate();
    if (stepError) {
      setError(stepError);
      return;
    }
    setStep((value) => Math.min(value + 1, lastStep));
  }

  function goBack() {
    setError("");
    setStep((value) => Math.max(value - 1, 0));
  }

  async function publish() {
    setError("");
    setMessage("");
    // Re-run every step's validation before publishing.
    for (let index = 0; index < steps.length; index += 1) {
      const stepError = steps[index].validate();
      if (stepError) {
        setStep(index);
        setError(stepError);
        return;
      }
    }

    const carDetails =
      carMode === "saved" && selectedVehicleId
        ? { vehicle_id: selectedVehicleId }
        : carMode === "profile" && profileCar
        ? {
            car_brand: profileCar.brand || null,
            car_model: profileCar.model || null,
            vehicle_number: profileCar.number || null,
            fuel_type: profileCar.fuel || null,
            car_type: profileCar.category || null,
            car_color: profileCar.color || "White",
            car_seats: defaultAvailableSeats(profileCar.category)
          }
        : {
            car_brand: resolvedNewBrand,
            car_model: carModel.trim(),
            vehicle_number: vehicleNumber.trim(),
            fuel_type: fuelType.trim(),
            car_type: newCarType,
            car_color: carColor.trim() || "White",
            car_seats: defaultAvailableSeats(newCarType)
          };

    try {
      const { data } = await api.post("/driver/rides", {
        ...carDetails,
        source_city: sourceCity,
        destination_city: destinationCity,
        distance_km: Number(distanceKm),
        journey_date: journeyDate,
        departure_time: departureTime,
        available_seats: availableSeats,
        price_per_seat: Number(pricePerSeat),
        pickup_points: pickupPoints.split(",").map((item) => item.trim()).filter(Boolean),
        drop_points: dropPoints.split(",").map((item) => item.trim()).filter(Boolean),
        route_stops: routeStops.split(",").map((item) => item.trim()).filter(Boolean),
        ride_rules: selectedRules,
        driver_instructions: instructionText,
        route_notes: routeNotes,
        luggage_allowance: luggageAllowance,
        smoking_allowed: !selectedRules.includes("no_smoking"),
        ac_available: true,
        women_only_preference: false,
        auto_confirm_bookings: autoConfirm
      });
      setMessage(`Ride published successfully as listing #${data.id}.`);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not publish the ride. Please check the backend is running and try again.");
    }
  }

  const progress = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-5 md:py-7">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Publish a ride</h1>
          <p className="mt-1 text-sm text-muted">One detail at a time so nothing is missed.</p>
        </div>

        {/* Progress: step count + bar. Identical on desktop and mobile. */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-muted">
            <span>
              Step {step + 1} of {steps.length}
            </span>
            <span>{current.title}</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {missingWhatsapp && (
          <p className="alert-warning">
            A WhatsApp contact number is required to publish a ride.{" "}
            <Link to="/profile" className="font-bold underline">
              Add it in My Profile
            </Link>{" "}
            first.
          </p>
        )}

        {message ? (
          <div className="card flex flex-col items-center gap-3 p-8 text-center">
            <span className="icon-tile h-12 w-12">
              <CheckCircle2 size={24} />
            </span>
            <h2 className="text-lg font-bold">Ride published</h2>
            <p className="alert-success">{message}</p>
            <Link to="/my-rides" className="btn-primary">
              View published rides
            </Link>
          </div>
        ) : (
          <>
            <StepShell title={current.title} subtitle={current.subtitle} icon={current.icon}>
              {current.key === "route" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="field-label">Source city</span>
                    <input className="input" value={sourceCity} onChange={(event) => setSourceCity(event.target.value)} placeholder="Rajkot" />
                  </label>
                  <label>
                    <span className="field-label">Destination city</span>
                    <input className="input" value={destinationCity} onChange={(event) => setDestinationCity(event.target.value)} placeholder="Jamnagar" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="field-label">Distance in km</span>
                    <input className="input" type="number" value={distanceKm} onChange={(event) => setDistanceKm(event.target.value)} placeholder="96" />
                    <span className="field-hint">Approx route distance.</span>
                  </label>
                </div>
              )}

              {current.key === "map" && (
                <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-sand bg-sand-light py-12 text-center">
                  <MapIcon size={28} className="text-muted" />
                  <p className="font-bold">Map selection coming soon</p>
                  <p className="text-sm text-muted">Pin exact pickup and drop locations in a later update.</p>
                </div>
              )}

              {current.key === "datetime" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="field-label">Journey date</span>
                    <TravelDatePicker value={journeyDate} onChange={setJourneyDate} label="Journey date" />
                    <span className="field-hint">Up to 10 days ahead.</span>
                  </label>
                  <label>
                    <span className="field-label">Departure time</span>
                    <input className="input" type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} />
                    <span className="field-hint">At least 3 hours from now.</span>
                  </label>
                </div>
              )}

              {current.key === "points" && (
                <div className="flex flex-col gap-4">
                  <label>
                    <span className="field-label">Pickup points - minimum 5 ({countPoints(pickupPoints)})</span>
                    <textarea className="input" rows={2} value={pickupPoints} onChange={(event) => setPickupPoints(event.target.value)} />
                    <span className="field-hint">Comma separated. Example: Bopal, Gota, Iscon.</span>
                  </label>
                  <label>
                    <span className="field-label">In-between stops ({countPoints(routeStops)})</span>
                    <textarea className="input" rows={2} value={routeStops} onChange={(event) => setRouteStops(event.target.value)} />
                    <span className="field-hint">Optional stops passengers can choose before the final drop.</span>
                  </label>
                  <label>
                    <span className="field-label">Drop points - minimum 5 ({countPoints(dropPoints)})</span>
                    <textarea className="input" rows={2} value={dropPoints} onChange={(event) => setDropPoints(event.target.value)} />
                    <span className="field-hint">Comma separated final-city drop points.</span>
                  </label>
                </div>
              )}

              {current.key === "car" && (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {carModeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCarMode(option.value)}
                        className={`rounded-xl border p-3 text-left transition ${
                          carMode === option.value ? "border-primary bg-primary text-white" : "border-sand bg-cream text-ink hover:border-primary"
                        }`}
                      >
                        <p className="text-sm font-bold">{option.label}</p>
                        <p className="mt-1 text-xs">{option.hint}</p>
                      </button>
                    ))}
                  </div>

                  {carMode === "profile" &&
                    (profileCar ? (
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-sand bg-white p-3">
                          <p className="text-xs font-bold text-muted">Car</p>
                          <p className="mt-1 font-bold">{[profileCar.brand, profileCar.model].filter(Boolean).join(" ") || "Not added"}</p>
                        </div>
                        <div className="rounded-xl border border-sand bg-white p-3">
                          <p className="text-xs font-bold text-muted">Vehicle number</p>
                          <p className="mt-1 font-bold">{profileCar.number || "Not added"}</p>
                        </div>
                        <div className="rounded-xl border border-sand bg-white p-3">
                          <p className="text-xs font-bold text-muted">Fuel · category</p>
                          <p className="mt-1 font-bold">{[profileCar.fuel, profileCar.category].filter(Boolean).join(" · ") || "Not added"}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="alert-warning">
                        No personal car saved{token ? "" : " (login required)"}.{" "}
                        <Link to="/profile" className="font-bold underline">
                          Add it in My Profile
                        </Link>
                        .
                      </p>
                    ))}

                  {carMode === "saved" &&
                    (savedVehicles?.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {savedVehicles.map((vehicle) => (
                          <button
                            key={vehicle.id}
                            type="button"
                            onClick={() => setSelectedVehicleId(vehicle.id)}
                            className={`rounded-xl border p-3 text-left transition ${
                              selectedVehicleId === vehicle.id ? "border-primary bg-primary text-white" : "border-sand bg-white text-ink hover:border-primary"
                            }`}
                          >
                            <p className="font-bold">
                              {vehicle.brand} {vehicle.model}
                            </p>
                            <p className="mt-1 text-xs">{vehicle.vehicle_number}</p>
                            <p className="text-xs">
                              {vehicle.car_type} · {vehicle.fuel_type} · {vehicle.seats} seats
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="alert-warning">
                        No saved vehicles{token ? "" : " (login required)"}.{" "}
                        <Link to="/driver/vehicle" className="font-bold underline">
                          Add one
                        </Link>
                        .
                      </p>
                    ))}

                  {carMode === "new" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        <span className="field-label">Car brand</span>
                        <select className="input" value={newCarBrand} onChange={(event) => setNewCarBrand(event.target.value)}>
                          {carBrands.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        {newCarBrand === "Other" && (
                          <input className="input mt-2" value={newCarBrandOther} onChange={(event) => setNewCarBrandOther(event.target.value)} placeholder="Enter brand name" />
                        )}
                      </label>
                      <label>
                        <span className="field-label">Car model</span>
                        <input className="input" value={carModel} onChange={(event) => setCarModel(event.target.value)} placeholder="Swift Dzire" />
                      </label>
                      <label>
                        <span className="field-label">Vehicle number</span>
                        <input className="input" value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="GJ01AB1234" />
                      </label>
                      <label>
                        <span className="field-label">Fuel type</span>
                        <select className="input" value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
                          <option value="Petrol">Petrol</option>
                          <option value="CNG">CNG</option>
                          <option value="EV">EV</option>
                          <option value="Diesel">Diesel</option>
                        </select>
                      </label>
                      <label>
                        <span className="field-label">Car color</span>
                        <input className="input" value={carColor} onChange={(event) => setCarColor(event.target.value)} placeholder="White" />
                      </label>
                      <label>
                        <span className="field-label">Car category</span>
                        <select className="input" value={newCarType} onChange={(event) => setNewCarType(event.target.value)}>
                          <option value="SUV">SUV</option>
                          <option value="Sedan">Sedan</option>
                          <option value="7 Seater">7 Seater</option>
                        </select>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {current.key === "seatsprice" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="field-label">Available seats</span>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={maxAvailableSeats}
                      value={availableSeats}
                      onChange={(event) => setAvailableSeats(Number(event.target.value))}
                    />
                    <span className="field-hint">
                      {selectedCarType?.toLowerCase().includes("7") ? "7 Seater allows up to 6." : "Sedan and SUV allow up to 3."}
                    </span>
                  </label>
                  <label>
                    <span className="field-label">Price per seat</span>
                    <input className="input" type="number" value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} placeholder="180" />
                    <span className="field-hint">Amount each passenger pays.</span>
                  </label>
                </div>
              )}

              {current.key === "rules" && (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2 sm:grid-cols-2">
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
                  <label>
                    <span className="field-label">Extra instructions</span>
                    <textarea className="input" rows={2} value={extraInstructions} onChange={(event) => setExtraInstructions(event.target.value)} />
                    <span className="field-hint">Any extra note passengers must read before booking.</span>
                  </label>
                </div>
              )}

              {current.key === "booking" && (
                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={() => setAutoConfirm((value) => !value)}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                      autoConfirm ? "border-primary bg-primary-soft" : "border-sand bg-cream hover:border-primary"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <Zap size={18} className="mt-0.5 text-primary" />
                      <span>
                        <span className="block font-bold">Instant booking</span>
                        <span className="block text-sm text-muted">Seats are confirmed automatically without your approval.</span>
                      </span>
                    </span>
                    <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${autoConfirm ? "bg-primary" : "bg-sand"}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${autoConfirm ? "left-[22px]" : "left-0.5"}`} />
                    </span>
                  </button>
                  <label>
                    <span className="field-label">Luggage allowance</span>
                    <input className="input" value={luggageAllowance} onChange={(event) => setLuggageAllowance(event.target.value)} placeholder="One cabin bag per passenger" />
                  </label>
                  <label>
                    <span className="field-label">Route notes</span>
                    <textarea className="input" rows={2} value={routeNotes} onChange={(event) => setRouteNotes(event.target.value)} placeholder="Halt, route preference, road condition" />
                  </label>
                </div>
              )}

              {current.key === "review" && (
                <div className="flex flex-col gap-3 text-sm">
                  {[
                    ["Route", `${sourceCity} -> ${destinationCity} · ${distanceKm} km`],
                    ["When", `${journeyDate} · ${departureTime}`],
                    [
                      "Car",
                      carMode === "saved" && selectedVehicle
                        ? `${selectedVehicle.brand} ${selectedVehicle.model} · ${selectedVehicle.vehicle_number}`
                        : carMode === "profile" && profileCar
                        ? `${profileCar.brand} ${profileCar.model} · ${profileCar.number}`
                        : `${resolvedNewBrand} ${carModel} · ${vehicleNumber} · ${carColor}`
                    ],
                    ["Seats & price", `${availableSeats} seats · Rs. ${pricePerSeat}/seat`],
                    ["Pickup points", `${countPoints(pickupPoints)} added`],
                    ["Drop points", `${countPoints(dropPoints)} added`],
                    ["Instant booking", autoConfirm ? "On" : "Off"]
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-start justify-between gap-3 border-b border-sand pb-2 last:border-0">
                      <span className="font-bold text-muted">{label}</span>
                      <span className="text-right font-semibold text-ink">{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </StepShell>

            {error && <p className="alert-error">{error}</p>}

            {/* Navigation: same controls every viewport. */}
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="btn-outline" onClick={goBack} disabled={step === 0}>
                <ArrowLeft size={16} />
                Back
              </button>
              {step < lastStep ? (
                <button type="button" className="btn-primary" onClick={goNext}>
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="btn-primary" onClick={publish} disabled={missingWhatsapp}>
                  <CheckCircle2 size={16} />
                  Publish ride
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
