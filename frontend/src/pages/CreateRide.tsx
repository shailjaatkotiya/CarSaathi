import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarCheck,
  Car,
  CheckCircle2,
  ListChecks,
  Route as RouteIcon,
  Zap
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { driverApi } from "../api/driver";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiErrorMessage } from "../lib/apiError";
import { queryKeys } from "../lib/queryKeys";
import TravelDatePicker, { clampTravelDate } from "../components/TravelDatePicker";
import TimePicker from "../components/TimePicker";
import TripRoutePlanner from "../components/TripRoutePlanner";
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

const carModeOptions: { value: CarMode; label: string; hint: string }[] = [
  { value: "saved", label: "A saved vehicle", hint: "Choose one of the vehicles you added earlier" },
  { value: "new", label: "Add a new car", hint: "Type fresh car details for this ride" }
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

export default function CreateRide() {
  const token = useSessionStore((state) => state.token);
  const defaultRideDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // All fields are controlled so values survive while steps mount/unmount.
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [sourceCity, setSourceCity] = useState("Rajkot");
  const [destinationCity, setDestinationCity] = useState("Jamnagar");
  // [lng, lat] behind the city labels, set when the driver picks on the map.
  const [sourceCoords, setSourceCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [distanceKm, setDistanceKm] = useState("96");
  const [journeyDate, setJourneyDate] = useState(clampTravelDate(defaultRideDate));
  const [departureTime, setDepartureTime] = useState("07:30");
  const [pricePerSeat, setPricePerSeat] = useState("180");

  const [pickupPoints, setPickupPoints] = useState("Rajkot Bus Stand, Kalawad Road, Gondal Road, University Road, Mavdi Circle");
  const [routeStops, setRouteStops] = useState("Dhrol, Reliance Circle");
  const [dropPoints, setDropPoints] = useState("Jamnagar Bus Stand, Patel Colony, Reliance Circle, Digjam Circle, Railway Station");

  const [carMode, setCarMode] = useState<CarMode>("saved");
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

  // Steps in order. Map step is intentionally an empty placeholder for a later
  // iteration. Validate returns an error string (or null) before advancing.
  const steps = [
    {
      key: "trip",
      title: "Route, pickup & drop points",
      subtitle: "Search cities on the map, select your route, and add pickup & drop points.",
      icon: <RouteIcon size={20} />,
      validate: () => {
        if (!sourceCity.trim() || !destinationCity.trim()) return "Enter both source and destination city.";
        if (countPoints(pickupPoints) < 1) return "Add at least 1 pickup point.";
        if (countPoints(dropPoints) < 1) return "Add at least 1 drop point.";
        if (!Number(distanceKm) || Number(distanceKm) <= 0) return "Select the route on the map to set the distance.";
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
      key: "car",
      title: "Which car will you drive?",
      subtitle: "Use your profile car, a saved vehicle, or add a new one.",
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
      const data = await driverApi.publishRide({
        ...carDetails,
        source_city: sourceCity,
        destination_city: destinationCity,
        source_lat: sourceCoords ? sourceCoords[1] : null,
        source_lng: sourceCoords ? sourceCoords[0] : null,
        destination_lat: destinationCoords ? destinationCoords[1] : null,
        destination_lng: destinationCoords ? destinationCoords[0] : null,
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
        women_only_preference: womenOnly,
        auto_confirm_bookings: autoConfirm
      });
      setMessage(`Ride published successfully as listing #${data.id}.`);
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
              {current.key === "trip" && (
                <TripRoutePlanner
                  sourceCity={sourceCity}
                  setSourceCity={setSourceCity}
                  destinationCity={destinationCity}
                  setDestinationCity={setDestinationCity}
                  pickupPoints={pickupPoints}
                  setPickupPoints={setPickupPoints}
                  routeStops={routeStops}
                  setRouteStops={setRouteStops}
                  dropPoints={dropPoints}
                  setDropPoints={setDropPoints}
                  setDistanceKm={setDistanceKm}
                  setSourceCoords={setSourceCoords}
                  setDestinationCoords={setDestinationCoords}
                />
              )}

              {current.key === "datetime" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <TravelDatePicker value={journeyDate} onChange={setJourneyDate} label="Journey date" />
                    {/* <span className="field-hint">Up to 10 days ahead.</span> */}
                  </label>
                  <label>
                    <TimePicker value={departureTime} onChange={setDepartureTime} label="Departure time" />
                    {/* <span className="field-hint">At least 3 hours from now.</span> */}
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
                  <label>
                    <span className="field-label">Additional details</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={routeNotes}
                      onChange={(event) => setRouteNotes(event.target.value)}
                      placeholder="Flexible about where and when to meet? Not taking the motorway? Got limited space in your boot? Keep passengers in the loop."
                    />
                  </label>

                  <label>
                    <span className="field-label">Luggage allowance</span>
                    <input className="input" value={luggageAllowance} onChange={(event) => setLuggageAllowance(event.target.value)} placeholder="One cabin bag per passenger" />
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
                        : `${resolvedNewBrand} ${carModel} · ${vehicleNumber} · ${carColor}`
                    ],
                    ["Seats & price", `${availableSeats} seats · Rs. ${pricePerSeat}/seat`],
                    ["Pickup points", `${countPoints(pickupPoints)} added`],
                    ["Drop points", `${countPoints(dropPoints)} added`],
                    ["Instant booking", autoConfirm ? "On" : "Off"],
                    ["Women only", womenOnly ? "Yes" : "No"]
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
