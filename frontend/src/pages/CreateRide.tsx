import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarCheck,
  Car,
  CheckCircle2,
  Download,
  ListChecks,
  MapPin,
  Route as RouteIcon,
  Zap
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { driverApi } from "../api/driver";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiErrorMessage } from "../lib/apiError";
import { formatShortDate, formatTimeAmPm } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";
import TravelDatePicker, { clampTravelDate } from "../components/TravelDatePicker";
import TimePicker from "../components/TimePicker";
import AutoGrowTextarea from "../components/AutoGrowTextarea";
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

type CarMode = "saved" | "new";

// "Add a new car" is the primary (default) option; a saved vehicle is secondary.
const carModeOptions: { value: CarMode; label: string; hint: string }[] = [
  { value: "new", label: "Add a new car", hint: "Type fresh car details for this ride" },
  { value: "saved", label: "A saved vehicle", hint: "Choose one of the vehicles you added earlier" }
];

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

// Draw the published-ride summary onto a canvas and trigger a PNG download.
function downloadRideImage(lines: [string, string][], title: string) {
  const scale = 2;
  const width = 640;
  const rowHeight = 54;
  const top = 150;
  const height = top + lines.length * rowHeight + 50;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = "#FFF8EC";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#546B41";
  ctx.fillRect(0, 0, width, 90);
  ctx.fillStyle = "#FFF8EC";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Carthi", 32, 56);
  ctx.fillStyle = "#171717";
  ctx.font = "bold 22px Arial";
  ctx.fillText(title, 32, 128);

  lines.forEach(([label, value], index) => {
    const y = top + index * rowHeight;
    ctx.fillStyle = "#737373";
    ctx.font = "bold 14px Arial";
    ctx.fillText(label.toUpperCase(), 32, y);
    ctx.fillStyle = "#171717";
    ctx.font = "600 18px Arial";
    ctx.fillText(value, 32, y + 24);
    ctx.strokeStyle = "#DCCCAC";
    ctx.beginPath();
    ctx.moveTo(32, y + 36);
    ctx.lineTo(width - 32, y + 36);
    ctx.stroke();
  });

  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = "carthi-published-ride.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export default function CreateRide() {
  const token = useSessionStore((state) => state.token);
  const navigate = useNavigate();
  const defaultRideDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // All fields are controlled so values survive while steps mount/unmount.
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [sourceCity, setSourceCity] = useState("Rajkot");
  const [destinationCity, setDestinationCity] = useState("Jamnagar");
  const [journeyDate, setJourneyDate] = useState(clampTravelDate(defaultRideDate));
  const [departureTime, setDepartureTime] = useState("07:30");
  const [pricePerSeat, setPricePerSeat] = useState("180");

  const [pickupPoints, setPickupPoints] = useState("Rajkot Bus Stand, Kalawad Road, Gondal Road");
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
  const [womenOnly, setWomenOnly] = useState(false);

  // Summary captured at publish time so the success screen can redraw the image.
  const summaryRef = useRef<[string, string][]>([]);

  const { data: me } = useCurrentUser();
  const { data: savedVehicles } = useQuery({
    queryKey: queryKeys.driver.vehicles,
    queryFn: driverApi.vehicles,
    enabled: Boolean(token)
  });

  const selectedVehicle = savedVehicles?.find((vehicle) => vehicle.id === selectedVehicleId);
  const selectedCarType =
    carMode === "saved" ? selectedVehicle?.car_type : newCarType;
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

  // Steps in order. Validate returns an error string (or null) before advancing.
  // No separate review step - the last data step publishes directly.
  const steps = [
    {
      key: "route",
      title: "Where are you going?",
      subtitle: "Set the cities your ride connects.",
      icon: <RouteIcon size={20} />,
      validate: () => {
        if (!sourceCity.trim() || !destinationCity.trim()) return "Enter both source and destination city.";
        return null;
      }
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
      subtitle: "Add 1 to 5 pickup points and at least 1 drop point, comma separated.",
      icon: <MapPin size={20} />,
      validate: () => {
        const pickups = countPoints(pickupPoints);
        if (pickups < 1) return "Add at least 1 pickup point.";
        if (pickups > 5) return "Add at most 5 pickup points.";
        if (countPoints(dropPoints) < 1) return "Add at least 1 drop point.";
        return null;
      }
    },
    {
      key: "car",
      title: "Which car will you drive?",
      subtitle: "Add a new car, or pick a saved vehicle.",
      icon: <Car size={20} />,
      validate: () => {
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
    // First step has nowhere to go inside the flow - return to Home.
    if (step === 0) {
      navigate("/");
      return;
    }
    setStep((value) => Math.max(value - 1, 0));
  }

  function buildSummary(): [string, string][] {
    const car =
      carMode === "saved" && selectedVehicle
        ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.vehicle_number})`
        : `${resolvedNewBrand} ${carModel} (${vehicleNumber}, ${carColor})`;
    return [
      ["From", sourceCity],
      ["To", destinationCity],
      ["Date", formatShortDate(journeyDate)],
      ["Time", formatTimeAmPm(departureTime)],
      ["Car", car],
      ["Seats & price", `${availableSeats} seats - Rs. ${pricePerSeat}/seat`],
      ["Pickup points", pickupPoints],
      ["Drop points", dropPoints]
    ];
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
      await driverApi.publishRide({
        ...carDetails,
        source_city: sourceCity,
        destination_city: destinationCity,
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
        women_only_preference: womenOnly,
        auto_confirm_bookings: autoConfirm
      });
      summaryRef.current = buildSummary();
      setMessage("Ride published successfully.");
      // Auto-download an image of the published ride details.
      downloadRideImage(summaryRef.current, `${sourceCity} to ${destinationCity}`);
    } catch (err) {
      setError(apiErrorMessage(err, "Could not publish the ride. Please check the backend is running and try again."));
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
        {!message && (
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
        )}

        {missingWhatsapp && !message && (
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
            <p className="text-sm text-muted">An image of your published ride details has been downloaded to your device.</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="btn-outline"
                onClick={() => downloadRideImage(summaryRef.current, `${sourceCity} to ${destinationCity}`)}
              >
                <Download size={16} />
                Download image again
              </button>
              <Link to="/my-rides" className="btn-primary">
                View published rides
              </Link>
            </div>
          </div>
        ) : (
          <>
            <StepShell title={current.title} subtitle={current.subtitle} icon={current.icon}>
              {current.key === "route" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className="input" value={sourceCity} onChange={(event) => setSourceCity(event.target.value)} placeholder="Source city" />
                  <input className="input" value={destinationCity} onChange={(event) => setDestinationCity(event.target.value)} placeholder="Destination city" />
                </div>
              )}

              {current.key === "datetime" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <TravelDatePicker value={journeyDate} onChange={setJourneyDate} label="Journey date" />
                  <TimePicker value={departureTime} onChange={setDepartureTime} label="Departure time" />
                </div>
              )}

              {current.key === "points" && (
                <div className="flex flex-col gap-4">
                  <AutoGrowTextarea
                    value={pickupPoints}
                    onChange={(event) => setPickupPoints(event.target.value)}
                    placeholder="Pickup points (1-5, comma separated). Example: Bopal, Gota, Iscon"
                  />
                  <span className="field-hint">Pickup points - 1 to 5 ({countPoints(pickupPoints)})</span>
                  <AutoGrowTextarea
                    value={routeStops}
                    onChange={(event) => setRouteStops(event.target.value)}
                    placeholder="In-between stops, comma separated (optional)"
                  />
                  <AutoGrowTextarea
                    value={dropPoints}
                    onChange={(event) => setDropPoints(event.target.value)}
                    placeholder="Drop points (at least 1, comma separated)"
                  />
                  <span className="field-hint">Drop points ({countPoints(dropPoints)})</span>
                </div>
              )}

              {current.key === "car" && (
                <div className="flex flex-col gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
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
                      <div>
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
                      </div>
                      <input className="input" value={carModel} onChange={(event) => setCarModel(event.target.value)} placeholder="Car model" />
                      <input className="input" value={vehicleNumber} onChange={(event) => setVehicleNumber(event.target.value)} placeholder="Vehicle number" />
                      <select className="input" value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
                        <option value="Petrol">Petrol</option>
                        <option value="CNG">CNG</option>
                        <option value="EV">EV</option>
                        <option value="Diesel">Diesel</option>
                      </select>
                      <input className="input" value={carColor} onChange={(event) => setCarColor(event.target.value)} placeholder="Car color" />
                      <select className="input" value={newCarType} onChange={(event) => setNewCarType(event.target.value)}>
                        <option value="SUV">SUV</option>
                        <option value="Sedan">Sedan</option>
                        <option value="7 Seater">7 Seater</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {current.key === "seatsprice" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <input
                      className="input"
                      type="number"
                      min={1}
                      max={maxAvailableSeats}
                      value={availableSeats}
                      onChange={(event) => setAvailableSeats(Number(event.target.value))}
                      placeholder="Available seats"
                    />
                    <span className="field-hint">
                      {selectedCarType?.toLowerCase().includes("7") ? "7 Seater allows up to 6." : "Sedan and SUV allow up to 3."}
                    </span>
                  </div>
                  <div>
                    <input className="input" type="number" value={pricePerSeat} onChange={(event) => setPricePerSeat(event.target.value)} placeholder="Price per seat" />
                    <span className="field-hint">Amount each passenger pays.</span>
                  </div>
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
                  <AutoGrowTextarea
                    value={extraInstructions}
                    onChange={(event) => setExtraInstructions(event.target.value)}
                    placeholder="Extra instructions passengers must read before booking"
                  />
                </div>
              )}

              {current.key === "booking" && (
                <div className="flex flex-col gap-3">
                  {/* Instant booking */}
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
                        <span className="block font-bold">Instant Booking</span>
                        <span className="block text-sm text-muted">Passengers can instantly book your ride</span>
                      </span>
                    </span>
                    <input type="checkbox" className="h-5 w-5 accent-primary shrink-0" checked={autoConfirm} onChange={() => {}} />
                  </button>

                  {/* Women only */}
                  <button
                    type="button"
                    onClick={() => setWomenOnly((v) => !v)}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition ${
                      womenOnly ? "border-primary bg-primary-soft" : "border-sand bg-cream hover:border-primary"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      <span className="mt-0.5 text-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M12 12v8M9 18h6"/></svg>
                      </span>
                      <span>
                        <span className="block font-bold">Women Only</span>
                        <span className="block text-sm text-muted">Make your ride only visible to women</span>
                      </span>
                    </span>
                    <input type="checkbox" className="h-5 w-5 accent-primary shrink-0" checked={womenOnly} onChange={() => {}} />
                  </button>

                  {/* Additional details */}
                  <AutoGrowTextarea
                    value={routeNotes}
                    onChange={(event) => setRouteNotes(event.target.value)}
                    placeholder="Flexible about where and when to meet? Not taking the motorway? Got limited space in your boot? Keep passengers in the loop."
                  />

                  <input className="input" value={luggageAllowance} onChange={(event) => setLuggageAllowance(event.target.value)} placeholder="Luggage allowance, e.g. one cabin bag per passenger" />
                </div>
              )}
            </StepShell>

            {error && <p className="alert-error">{error}</p>}

            {/* Navigation: same controls every viewport. */}
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="btn-outline" onClick={goBack}>
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
