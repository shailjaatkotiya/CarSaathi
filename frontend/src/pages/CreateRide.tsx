import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  HelpCircle,
  Map as MapIcon,
  MapPin,
  Minus,
  Plus,
  Route as RouteIcon,
  ShieldCheck,
  Users,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, User } from "../api/client";
import { carBrands } from "../data/carBrands";
import { useSessionStore } from "../store/session";

const rideRules = [
  { value: "no_pets", label: "No pets", hint: "Prefer not to travel with pets" },
  { value: "no_smoking", label: "No smoking", hint: "Keep the car smoke-free" },
  { value: "no_alcohol", label: "No alcohol", hint: "No alcohol during the ride" },
  { value: "no_tobacco", label: "No tobacco", hint: "No tobacco in the car" },
  { value: "no_music", label: "Quiet ride", hint: "Music only if everyone agrees" },
  { value: "no_extra_children", label: "No extra children", hint: "Book every seat needed" }
];

const defaultRuleValues = ["no_pets", "no_smoking", "no_alcohol", "no_tobacco"];

const addressSuggestions = [
  "Mumbai Central, Mumbai, Maharashtra",
  "Wakad Brg, Patil Nagar, Balewadi, Pune, Maharashtra",
  "Navi Mumbai, Sanpada Rd, Sector 2, Maharashtra",
  "Pimpri-Chinchwad, Pune, Maharashtra",
  "Chakan, Pune - Nashik Hwy, Maharashtra"
];

const routeOptions = [
  { id: "fast", label: "2 hr 50 min - Tolls", distance: 149, road: "Mumbai-Pune Expressway", note: "Fastest route" },
  { id: "balanced", label: "3 hr 20 min - Tolls", distance: 156, road: "NH 48", note: "Balanced with more pickup points" },
  { id: "notolls", label: "4 hr - No tolls", distance: 168, road: "Old Mumbai-Pune Hwy", note: "Avoids toll roads" }
];

type CarMode = "profile" | "saved" | "new";

const carModeOptions: { value: CarMode; label: string; hint: string }[] = [
  { value: "profile", label: "Profile car", hint: "Use the car saved in your profile" },
  { value: "saved", label: "Saved vehicle", hint: "Pick one of your saved vehicles" },
  { value: "new", label: "Add a new car", hint: "Enter fresh car details for this ride" }
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

function defaultAvailableSeats(carType?: string | null) {
  return carType?.toLowerCase().includes("7") ? 6 : 3;
}

function countPoints(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean).length;
}

function nextDate(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function formatRuleLabel(value: string) {
  return rideRules.find((rule) => rule.value === value)?.label ?? value.replace(/_/g, " ");
}

function StepShell({
  title,
  subtitle,
  icon,
  children
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="market-shell">
      <div className="flex items-start gap-3">
        <span className="market-icon">{icon}</span>
        <div>
          <h2 className="text-2xl font-black leading-tight text-ink md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Counter({
  value,
  min,
  max,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5">
      <button type="button" className="round-action" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Minus size={22} />
      </button>
      <span className="text-6xl font-black leading-none text-ink tabular-nums">{value}</span>
      <button type="button" className="round-action" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Plus size={22} />
      </button>
    </div>
  );
}

export default function CreateRide() {
  const token = useSessionStore((state) => state.token);
  const defaultRideDate = nextDate(2);
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [sourceCity, setSourceCity] = useState("Mumbai");
  const [destinationCity, setDestinationCity] = useState("Pune");
  const [pickupAddress, setPickupAddress] = useState(addressSuggestions[0]);
  const [dropAddress, setDropAddress] = useState(addressSuggestions[1]);
  const [selectedRoute, setSelectedRoute] = useState(routeOptions[0].id);
  const [journeyDate, setJourneyDate] = useState(defaultRideDate);
  const [departureTime, setDepartureTime] = useState("08:00");
  const [pricePerSeat, setPricePerSeat] = useState("470");

  const [pickupPoints, setPickupPoints] = useState("Mumbai Central, Dadar, Sion, Chembur, Vashi");
  const [routeStops, setRouteStops] = useState("Navi Mumbai, Lonavala");
  const [dropPoints, setDropPoints] = useState("Wakad, Hinjewadi, Shivajinagar, Swargate, Kothrud");

  const [carMode, setCarMode] = useState<CarMode>("new");
  const [newCarBrand, setNewCarBrand] = useState("Maruti Suzuki");
  const [newCarBrandOther, setNewCarBrandOther] = useState("");
  const [carModel, setCarModel] = useState("Swift Dzire");
  const [vehicleNumber, setVehicleNumber] = useState("MH01AB1234");
  const [fuelType, setFuelType] = useState("Petrol");
  const [carColor, setCarColor] = useState("White");
  const [newCarType, setNewCarType] = useState("Sedan");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  const [availableSeats, setAvailableSeats] = useState(3);
  const [maxTwoBack, setMaxTwoBack] = useState(false);
  const [womenOnly, setWomenOnly] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [selectedRules, setSelectedRules] = useState(defaultRuleValues);
  const [extraInstructions, setExtraInstructions] = useState(
    "Flexible about where and when to meet? Not taking the motorway? Got limited space in your boot? Keep passengers in the loop."
  );
  const [luggageAllowance, setLuggageAllowance] = useState("One cabin bag");
  const [routeNotes, setRouteNotes] = useState("Short halt available if everyone agrees.");
  const [zenFlexible, setZenFlexible] = useState(true);

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
  const selectedRouteOption = routeOptions.find((option) => option.id === selectedRoute) ?? routeOptions[0];
  const recommendedLow = Math.max(80, Math.round(selectedRouteOption.distance * 1.9));
  const recommendedHigh = Math.round(selectedRouteOption.distance * 2.2);

  useEffect(() => {
    setAvailableSeats(defaultAvailableSeats(selectedCarType));
  }, [selectedCarType]);

  useEffect(() => {
    setPricePerSeat(String(Math.round((recommendedLow + recommendedHigh) / 2)));
  }, [recommendedLow, recommendedHigh]);

  const instructionText = useMemo(
    () =>
      [
        maxTwoBack ? "- Max. 2 in the back" : null,
        womenOnly ? "- Women only ride" : null,
        zenFlexible ? "- Flexible route option enabled" : null,
        ...selectedRules.map((rule) => `- ${formatRuleLabel(rule)}`),
        ...extraInstructions
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line) => `- ${line.replace(/^-+\s*/, "")}`)
      ]
        .filter(Boolean)
        .join("\n"),
    [extraInstructions, maxTwoBack, selectedRules, womenOnly, zenFlexible]
  );

  function toggleRule(value: string, checked: boolean) {
    setSelectedRules((current) => {
      if (checked) return current.includes(value) ? current : [...current, value];
      return current.filter((rule) => rule !== value);
    });
  }

  const missingWhatsapp = Boolean(me) && !me?.whatsapp_number?.trim();

  const steps = [
    {
      key: "cities",
      title: "Where are you going?",
      subtitle: "Start with the city pair. Exact map pinning is intentionally empty for now.",
      icon: <RouteIcon size={22} />,
      validate: () => {
        if (!sourceCity.trim() || !destinationCity.trim()) return "Enter both source and destination city.";
        return null;
      }
    },
    {
      key: "addresses",
      title: "Choose pickup and drop",
      subtitle: "Use suggested addresses for now. Map search will be connected in the next iteration.",
      icon: <MapPin size={22} />,
      validate: () => {
        if (!pickupAddress.trim() || !dropAddress.trim()) return "Select pickup and drop addresses.";
        return null;
      }
    },
    {
      key: "route",
      title: "What is your route?",
      subtitle: "A route choice helps estimate price, timing, and stopovers.",
      icon: <MapIcon size={22} />,
      validate: () => null
    },
    {
      key: "date",
      title: "When are you going?",
      subtitle: "Publish up to 10 days ahead. Repeating ride dates can come next.",
      icon: <CalendarDays size={22} />,
      validate: () => {
        if (!journeyDate) return "Choose a journey date.";
        return null;
      }
    },
    {
      key: "time",
      title: "What time will you pick up passengers?",
      subtitle: "Rides must be published at least 3 hours before departure.",
      icon: <Clock size={22} />,
      validate: () => {
        if (!departureTime) return "Choose a departure time.";
        return null;
      }
    },
    {
      key: "stopovers",
      title: "Add stopovers to get more passengers",
      subtitle: "Add pickups, in-between stops, and drops. Carthi keeps the backend minimum of 5 pickup and 5 drop points.",
      icon: <MapPin size={22} />,
      validate: () => {
        if (countPoints(pickupPoints) < 5) return "Add minimum 5 pickup points.";
        if (countPoints(dropPoints) < 5) return "Add minimum 5 drop points.";
        return null;
      }
    },
    {
      key: "car",
      title: "Which car will you drive?",
      subtitle: "Keep advanced Carthi vehicle options while making the choice simple.",
      icon: <Car size={22} />,
      validate: () => {
        if (carMode === "profile" && !profileCarComplete) return "Complete your profile car first.";
        if (carMode === "saved" && !selectedVehicleId) return "Select one of your saved vehicles.";
        if (carMode === "new") {
          if (!resolvedNewBrand || !carModel.trim() || !vehicleNumber.trim() || !fuelType.trim() || !newCarType.trim()) {
            return "Enter complete car details.";
          }
        }
        return null;
      }
    },
    {
      key: "seats",
      title: "How many passengers can you take?",
      subtitle: "Set seats and passenger comfort options.",
      icon: <Users size={22} />,
      validate: () => {
        if (availableSeats < 1) return "Offer at least 1 seat.";
        if (availableSeats > maxAvailableSeats) return `${selectedCarType || "This car"} can publish up to ${maxAvailableSeats} seats.`;
        return null;
      }
    },
    {
      key: "instant",
      title: "Enable Instant Booking for your passengers",
      subtitle: "Passengers prefer quick answers. You can still review every request if needed.",
      icon: <Zap size={22} />,
      validate: () => null
    },
    {
      key: "price",
      title: "Set your price per seat",
      subtitle: `Recommended price: Rs. ${recommendedLow} - Rs. ${recommendedHigh}.`,
      icon: <Banknote size={22} />,
      validate: () => {
        if (!Number(pricePerSeat) || Number(pricePerSeat) < 1) return "Enter a valid price per seat.";
        return null;
      }
    },
    {
      key: "rules",
      title: "Passenger options",
      subtitle: "Make expectations clear before anyone books.",
      icon: <ShieldCheck size={22} />,
      validate: () => null
    },
    {
      key: "zen",
      title: "Save up to 3 times more on this ride",
      subtitle: "A flexible route option can help fill seats. Keep it optional for drivers.",
      icon: <HelpCircle size={22} />,
      validate: () => null
    },
    {
      key: "comment",
      title: "Ready to publish your ride?",
      subtitle: "Add a final comment for passengers, then publish.",
      icon: <CheckCircle2 size={22} />,
      validate: () => null
    }
  ];

  const lastStep = steps.length - 1;
  const current = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

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
        source_city: sourceCity.trim(),
        destination_city: destinationCity.trim(),
        distance_km: selectedRouteOption.distance,
        journey_date: journeyDate,
        departure_time: departureTime,
        available_seats: availableSeats,
        price_per_seat: Number(pricePerSeat),
        pickup_points: pickupPoints
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        drop_points: dropPoints
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        route_stops: routeStops
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        ride_rules: selectedRules,
        driver_instructions: instructionText,
        route_notes: `${selectedRouteOption.label} - ${selectedRouteOption.road}. ${routeNotes}`,
        luggage_allowance: luggageAllowance,
        smoking_allowed: !selectedRules.includes("no_smoking"),
        ac_available: true,
        women_only_preference: womenOnly,
        auto_confirm_bookings: autoConfirm
      });
      setMessage(`Ride published successfully as listing #${data.id}.`);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(detail || "Could not publish the ride. Please check the backend is running and try again.");
    }
  }

  return (
    <div className="market-page">
      <div className="market-flow">
        <div className="flex items-center justify-between gap-3">
          <button type="button" className="icon-link" onClick={goBack} disabled={step === 0} aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <span className="text-xs font-black uppercase tracking-wide text-muted">
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-light">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
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
          <div className="market-success">
            <div className="h-36 bg-primary px-6 py-7 text-white">
              <h1 className="text-3xl font-black">Your ride is published!</h1>
            </div>
            <div className="px-6 pb-8 pt-10">
              <h2 className="text-2xl font-black">One last step: verify your profile</h2>
              <div className="mt-6 divide-y divide-sand">
                <Link to="/verify" className="flex items-center gap-3 py-4 font-bold text-primary">
                  <Plus size={20} />
                  Verify your Govt. ID
                </Link>
                <Link to="/profile" className="flex items-center gap-3 py-4 font-bold text-primary">
                  <Plus size={20} />
                  Confirm your email
                </Link>
                <div className="flex items-center gap-3 py-4 font-bold">
                  <CheckCircle2 size={20} className="text-primary" />
                  Confirmed phone number
                </div>
              </div>
              <p className="alert-success mt-6">{message}</p>
              <Link to="/my-rides" className="btn-outline mt-8 w-full justify-center">
                See my ride offer
              </Link>
            </div>
          </div>
        ) : (
          <>
            <StepShell title={current.title} subtitle={current.subtitle} icon={current.icon}>
              {current.key === "cities" && (
                <div className="stack">
                  <label>
                    <span className="field-label">Leaving from</span>
                    <input className="input-lg" value={sourceCity} onChange={(event) => setSourceCity(event.target.value)} />
                  </label>
                  <label>
                    <span className="field-label">Going to</span>
                    <input className="input-lg" value={destinationCity} onChange={(event) => setDestinationCity(event.target.value)} />
                  </label>
                  <div className="map-empty">
                    <MapIcon size={28} />
                    <p className="font-black">Map feature reserved</p>
                    <p className="text-sm text-muted">Exact map interaction will be connected in the next iteration.</p>
                  </div>
                </div>
              )}

              {current.key === "addresses" && (
                <div className="stack">
                  <label>
                    <span className="field-label">Pick-up</span>
                    <select className="input-lg" value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)}>
                      {addressSuggestions.map((address) => (
                        <option key={address} value={address}>
                          {address}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="field-label">Drop-off</span>
                    <select className="input-lg" value={dropAddress} onChange={(event) => setDropAddress(event.target.value)}>
                      {addressSuggestions.map((address) => (
                        <option key={address} value={address}>
                          {address}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="button" className="list-row">
                    <MapPin size={20} />
                    <span>
                      <span className="block font-black">Use current location</span>
                      <span className="text-sm text-muted">Placeholder action until map details are shared.</span>
                    </span>
                    <ArrowRight size={18} className="ml-auto" />
                  </button>
                </div>
              )}

              {current.key === "route" && (
                <div className="stack">
                  <div className="route-preview">
                    <div className="route-line" />
                    <div className="route-dot route-dot-start" />
                    <div className="route-dot route-dot-end" />
                    <p className="absolute left-5 top-5 text-xs font-black text-muted">{sourceCity}</p>
                    <p className="absolute bottom-5 right-5 text-xs font-black text-muted">{destinationCity}</p>
                  </div>
                  {routeOptions.map((option) => (
                    <button key={option.id} type="button" className="choice-row" onClick={() => setSelectedRoute(option.id)}>
                      <span className={`radio-dot ${selectedRoute === option.id ? "radio-dot-active" : ""}`} />
                      <span>
                        <span className="block font-black">{option.label}</span>
                        <span className="text-sm text-muted">
                          {option.distance} km - {option.road} - {option.note}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {current.key === "date" && (
                <div className="stack">
                  <div className="info-pill">
                    <CalendarDays size={18} />
                    <span>
                      <b>Doing this ride often?</b> You can select one ride date now. Multi-date publish can be added later.
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((offset) => {
                      const value = nextDate(offset);
                      return (
                        <button
                          key={value}
                          type="button"
                          className={`date-chip ${journeyDate === value ? "date-chip-active" : ""}`}
                          onClick={() => setJourneyDate(value)}
                        >
                          {formatDate(value)}
                        </button>
                      );
                    })}
                  </div>
                  <input className="input-lg" type="date" value={journeyDate} onChange={(event) => setJourneyDate(event.target.value)} />
                </div>
              )}

              {current.key === "time" && (
                <label className="block">
                  <input className="time-input" type="time" value={departureTime} onChange={(event) => setDepartureTime(event.target.value)} />
                </label>
              )}

              {current.key === "stopovers" && (
                <div className="stack">
                  <label>
                    <span className="field-label">Pickup points - minimum 5 ({countPoints(pickupPoints)})</span>
                    <textarea className="input-lg" rows={2} value={pickupPoints} onChange={(event) => setPickupPoints(event.target.value)} />
                  </label>
                  <label>
                    <span className="field-label">Suggested stopovers</span>
                    <textarea className="input-lg" rows={2} value={routeStops} onChange={(event) => setRouteStops(event.target.value)} />
                  </label>
                  <label>
                    <span className="field-label">Drop points - minimum 5 ({countPoints(dropPoints)})</span>
                    <textarea className="input-lg" rows={2} value={dropPoints} onChange={(event) => setDropPoints(event.target.value)} />
                  </label>
                </div>
              )}

              {current.key === "car" && (
                <div className="stack">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {carModeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setCarMode(option.value)}
                        className={`option-card ${carMode === option.value ? "option-card-active" : ""}`}
                      >
                        <span className="font-black">{option.label}</span>
                        <span className="mt-1 block text-xs">{option.hint}</span>
                      </button>
                    ))}
                  </div>

                  {carMode === "profile" &&
                    (profileCar ? (
                      <div className="summary-grid">
                        <span>{[profileCar.brand, profileCar.model].filter(Boolean).join(" ") || "Not added"}</span>
                        <span>{profileCar.number || "Not added"}</span>
                        <span>{[profileCar.fuel, profileCar.category].filter(Boolean).join(" - ") || "Not added"}</span>
                      </div>
                    ) : (
                      <p className="alert-warning">
                        No personal car saved. <Link to="/profile" className="font-bold underline">Add it in My Profile</Link>.
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
                            className={`choice-row ${selectedVehicleId === vehicle.id ? "choice-row-active" : ""}`}
                          >
                            <span className={`radio-dot ${selectedVehicleId === vehicle.id ? "radio-dot-active" : ""}`} />
                            <span>
                              <span className="block font-black">
                                {vehicle.brand} {vehicle.model}
                              </span>
                              <span className="text-sm text-muted">
                                {vehicle.vehicle_number} - {vehicle.car_type} - {vehicle.fuel_type}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="alert-warning">
                        No saved vehicles. <Link to="/driver/vehicle" className="font-bold underline">Add one</Link>.
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
                        <input className="input" value={carModel} onChange={(event) => setCarModel(event.target.value)} />
                      </label>
                      <label>
                        <span className="field-label">Vehicle number</span>
                        <input className="input" value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} />
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
                        <input className="input" value={carColor} onChange={(event) => setCarColor(event.target.value)} />
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

              {current.key === "seats" && (
                <div className="stack">
                  <Counter value={availableSeats} min={1} max={maxAvailableSeats} onChange={setAvailableSeats} />
                  <button type="button" className="toggle-row" onClick={() => setMaxTwoBack((value) => !value)}>
                    <span className={`square-check ${maxTwoBack ? "square-check-active" : ""}`} />
                    <span>
                      <span className="block font-black">Max. 2 in the back</span>
                      <span className="text-sm text-muted">Think comfort, keep the middle seat empty</span>
                    </span>
                    <Users size={20} className="ml-auto text-muted" />
                  </button>
                  <button type="button" className="toggle-row" onClick={() => setWomenOnly((value) => !value)}>
                    <span className={`square-check ${womenOnly ? "square-check-active" : ""}`} />
                    <span>
                      <span className="block font-black">Women Only</span>
                      <span className="text-sm text-muted">Make your ride only visible to women</span>
                    </span>
                  </button>
                </div>
              )}

              {current.key === "instant" && (
                <div className="stack">
                  <div className="rounded-2xl bg-primary-soft p-5 text-center">
                    <Zap size={56} className="mx-auto text-primary" />
                  </div>
                  <button type="button" className="choice-row" onClick={() => setAutoConfirm(true)}>
                    <span className={`radio-dot ${autoConfirm ? "radio-dot-active" : ""}`} />
                    <span>
                      <span className="block font-black text-primary">Enable Instant Booking</span>
                      <span className="text-sm text-muted">Passengers can instantly book your ride.</span>
                    </span>
                    <ArrowRight size={18} className="ml-auto" />
                  </button>
                  <button type="button" className="choice-row" onClick={() => setAutoConfirm(false)}>
                    <span className={`radio-dot ${!autoConfirm ? "radio-dot-active" : ""}`} />
                    <span>
                      <span className="block font-black">Review every request before it expires</span>
                      <span className="text-sm text-muted">You approve or reject each request manually.</span>
                    </span>
                  </button>
                </div>
              )}

              {current.key === "price" && (
                <div className="stack">
                  <div className="flex items-center justify-between gap-5">
                    <button type="button" className="round-action" onClick={() => setPricePerSeat(String(Math.max(1, Number(pricePerSeat) - 10)))}>
                      <Minus size={22} />
                    </button>
                    <span className="text-6xl font-black leading-none text-primary tabular-nums">Rs. {pricePerSeat}</span>
                    <button type="button" className="round-action" onClick={() => setPricePerSeat(String(Number(pricePerSeat) + 10))}>
                      <Plus size={22} />
                    </button>
                  </div>
                  <div className="text-center">
                    <span className="rounded-lg bg-primary px-3 py-1 text-sm font-black text-white">
                      Recommended price: Rs. {recommendedLow} - Rs. {recommendedHigh}
                    </span>
                    <p className="mt-2 text-sm text-muted">You'll get passengers in no time.</p>
                  </div>
                </div>
              )}

              {current.key === "rules" && (
                <div className="stack">
                  <label>
                    <span className="field-label">Luggage</span>
                    <input className="input-lg" value={luggageAllowance} onChange={(event) => setLuggageAllowance(event.target.value)} />
                  </label>
                  {rideRules.map((rule) => (
                    <label key={rule.value} className="toggle-row">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedRules.includes(rule.value)}
                        onChange={(event) => toggleRule(rule.value, event.target.checked)}
                      />
                      <span className={`square-check ${selectedRules.includes(rule.value) ? "square-check-active" : ""}`} />
                      <span>
                        <span className="block font-black">{rule.label}</span>
                        <span className="text-sm text-muted">{rule.hint}</span>
                      </span>
                    </label>
                  ))}
                  <label>
                    <span className="field-label">Route notes</span>
                    <textarea className="input-lg" rows={2} value={routeNotes} onChange={(event) => setRouteNotes(event.target.value)} />
                  </label>
                </div>
              )}

              {current.key === "zen" && (
                <div className="stack">
                  <button type="button" className={`zen-card ${zenFlexible ? "zen-card-active" : ""}`} onClick={() => setZenFlexible(true)}>
                    <span className={`radio-dot ${zenFlexible ? "radio-dot-active" : ""}`} />
                    <span>
                      <span className="block font-black">Activate flexible routing for free on this ride</span>
                      <span className="mt-3 block text-sm text-muted">One booking can fill empty seats, one passenger coordinates, and you stay free to accept requests based on schedule.</span>
                    </span>
                  </button>
                  <button type="button" className="choice-row" onClick={() => setZenFlexible(false)}>
                    <span className={`radio-dot ${!zenFlexible ? "radio-dot-active" : ""}`} />
                    <span className="font-black">Continue without the flexible option</span>
                  </button>
                </div>
              )}

              {current.key === "comment" && (
                <div className="stack">
                  <label>
                    <span className="field-label">Additional details</span>
                    <textarea className="input-lg min-h-32" value={extraInstructions} onChange={(event) => setExtraInstructions(event.target.value)} />
                  </label>
                  <div className="review-list">
                    <div><b>Route</b><span>{sourceCity} to {destinationCity}</span></div>
                    <div><b>When</b><span>{formatDate(journeyDate)} at {departureTime}</span></div>
                    <div><b>Price</b><span>Rs. {pricePerSeat} per seat</span></div>
                    <div><b>Seats</b><span>{availableSeats}</span></div>
                    <div><b>Booking</b><span>{autoConfirm ? "Instant booking" : "Manual approval"}</span></div>
                  </div>
                </div>
              )}
            </StepShell>

            {error && <p className="alert-error">{error}</p>}

            <div className="flow-actions">
              {step < lastStep ? (
                <button type="button" className="round-next" onClick={goNext} aria-label="Continue">
                  <ArrowRight size={28} />
                </button>
              ) : (
                <button type="button" className="btn-primary w-full justify-center py-3 text-base" onClick={publish} disabled={missingWhatsapp}>
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
