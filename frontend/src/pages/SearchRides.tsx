import {
  ChevronDown,
  ChevronUp,
  Cigarette,
  Clock,
  Hourglass,
  IndianRupee,
  MapPin,
  PawPrint,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Zap,
  type LucideIcon
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ridesApi } from "../api/rides";
import { queryKeys } from "../lib/queryKeys";
import RideListItem from "../components/RideListItem";
import TravelDatePicker, { clampTravelDate } from "../components/TravelDatePicker";

type SortOption = "earliest_departure" | "lowest_price" | "close_to_departure_point" | "close_to_arrival_point" | "shortest_ride";

const sortOptions: { value: SortOption; label: string; Icon: LucideIcon }[] = [
  { value: "earliest_departure", label: "Earliest departure", Icon: Clock },
  { value: "lowest_price", label: "Lowest price", Icon: IndianRupee },
  { value: "close_to_departure_point", label: "Close to departure point", Icon: MapPin },
  { value: "close_to_arrival_point", label: "Close to arrival point", Icon: MapPin },
  { value: "shortest_ride", label: "Shortest ride", Icon: Hourglass }
];

const departureOptions = [
  { value: "before_0600", label: "Before 06:00" },
  { value: "morning", label: "06:00 - 12:00" },
  { value: "afternoon", label: "12:01 - 18:00" },
  { value: "after_1800", label: "After 18:00" }
];

function FilterCheckbox({
  checked,
  label,
  Icon,
  onChange
}: {
  checked: boolean;
  label: string;
  Icon?: LucideIcon;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      className="flex min-h-[40px] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-sand-light"
      onClick={onChange}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
          checked ? "border-primary bg-primary text-white" : "border-sand bg-white"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-sm bg-white" />}
      </span>
      <span className={`min-w-0 flex-1 ${checked ? "font-bold text-ink" : "font-semibold text-muted"}`}>{label}</span>
      {Icon && <Icon size={18} className={checked ? "text-primary" : "text-muted"} />}
    </button>
  );
}

export default function SearchRides() {
  const [searchParams] = useSearchParams();
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [sourceArea, setSourceArea] = useState("");
  const [destinationArea, setDestinationArea] = useState("");
  const [journeyDate, setJourneyDate] = useState(clampTravelDate(searchParams.get("date")));
  const [departureWindows, setDepartureWindows] = useState<string[]>([]);
  const [carType, setCarType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [driverRating, setDriverRating] = useState("");
  const [acAvailable, setAcAvailable] = useState("");
  const [verifiedProfile, setVerifiedProfile] = useState(false);
  const [instantBooking, setInstantBooking] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("earliest_departure");
  const [seats, setSeats] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const hasRoute = Boolean(source.trim() && destination.trim());

  const rideSearchParams = {
    source: source.trim() || undefined,
    destination: destination.trim() || undefined,
    source_area: sourceArea || undefined,
    destination_area: destinationArea || undefined,
    journey_date: journeyDate || undefined,
    departure_window: departureWindows.join(",") || undefined,
    car_type: carType || undefined,
    fuel_type: fuelType || undefined,
    min_price: minPrice || undefined,
    max_price: maxPrice || undefined,
    driver_rating: driverRating || undefined,
    ac_available: acAvailable || undefined,
    verified_profile: verifiedProfile || undefined,
    instant_booking: instantBooking || undefined,
    smoking_allowed: smokingAllowed || undefined,
    pets_allowed: petsAllowed || undefined,
    sort_by: sortBy,
    seats
  };

  const { data: rawData, isLoading, refetch } = useQuery({
    queryKey: queryKeys.rides.search(rideSearchParams),
    queryFn: () => ridesApi.search(rideSearchParams),
    enabled: hasRoute
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const data = rawData?.filter((ride) => {
    if (ride.journey_date !== todayStr) return true;
    const [h, m] = ride.departure_time.slice(0, 5).split(":").map(Number);
    return h * 60 + m > nowMinutes;
  });

  function toggleDepartureWindow(value: string) {
    setDepartureWindows((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  }

  function clearFilters() {
    setSortBy("earliest_departure");
    setSourceArea("");
    setDestinationArea("");
    setDepartureWindows([]);
    setCarType("");
    setFuelType("");
    setMinPrice("");
    setMaxPrice("");
    setDriverRating("");
    setAcAvailable("");
    setVerifiedProfile(false);
    setInstantBooking(false);
    setSmokingAllowed(false);
    setPetsAllowed(false);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:py-6">
      {/* Top search bar: pickup, drop off, date, passengers */}
      <div className="card flex flex-col gap-2 rounded-2xl p-2 md:flex-row md:items-stretch md:gap-0 md:divide-x md:divide-sand">
        <label className="flex flex-1 flex-col justify-center px-3 py-2">
          <input
            className="w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Enter pickup city"
          />
        </label>
        <label className="flex flex-1 flex-col justify-center px-3 py-2">
          <input
            className="w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Enter drop off city"
          />
        </label>
        <div className="flex items-center px-2 md:w-[160px]">
          <TravelDatePicker value={journeyDate} onChange={setJourneyDate} label="Date" />
        </div>
        <label className="flex flex-col justify-center px-3 py-2 md:w-[150px]">
          <span className="field-label mb-0">Passengers</span>
          <span className="flex items-center gap-2">
            <Users size={15} className="text-muted" />
            <select
              className="w-full bg-transparent text-sm font-bold text-ink outline-none"
              value={seats}
              onChange={(event) => setSeats(Number(event.target.value))}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </span>
        </label>
        <button type="button" className="btn-primary justify-center gap-2 md:rounded-xl md:px-6" onClick={() => refetch()}>
          <Search size={18} />
          Search
        </button>
      </div>

      {/* Mobile-only toggle: show/hide sort + filters (sidebar is always visible on desktop) */}
      <button
        type="button"
        className="btn-outline mt-3 w-full justify-center gap-2 lg:hidden"
        onClick={() => setShowFilters((current) => !current)}
        aria-expanded={showFilters}
      >
        <SlidersHorizontal size={16} />
        {showFilters ? "Hide filters" : "Sort & filters"}
        {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      <div className="mt-3 grid gap-4 lg:mt-4 lg:grid-cols-[280px_1fr]">
        {/* Left sidebar: sort + filters. Hidden on mobile until toggled, always shown on desktop. */}
        <aside className={`card h-max rounded-2xl p-4 lg:sticky lg:top-4 lg:block ${showFilters ? "block" : "hidden"}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Sort by</h2>
            <button type="button" className="text-xs font-bold text-muted transition hover:text-primary" onClick={clearFilters}>
              Clear all
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {sortOptions.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                className="flex min-h-[40px] items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-sand-light"
                onClick={() => setSortBy(value)}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                    sortBy === value ? "border-primary" : "border-sand"
                  }`}
                >
                  {sortBy === value && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
                <span className={`min-w-0 flex-1 ${sortBy === value ? "font-bold text-ink" : "font-semibold text-muted"}`}>{label}</span>
                <Icon size={18} className={sortBy === value ? "text-primary" : "text-muted"} />
              </button>
            ))}
          </div>

          <hr className="my-4 border-sand" />

          <section>
            <h2 className="text-base font-bold">Departure time</h2>
            <div className="mt-3 flex flex-col gap-1">
              {departureOptions.map((option) => (
                <FilterCheckbox
                  key={option.value}
                  label={option.label}
                  checked={departureWindows.includes(option.value)}
                  onChange={() => toggleDepartureWindow(option.value)}
                />
              ))}
            </div>
          </section>

          <hr className="my-4 border-sand" />

          <section>
            <h2 className="text-base font-bold">Trust and safety</h2>
            <div className="mt-3 flex flex-col gap-1">
              <FilterCheckbox
                label="Verified Profile"
                checked={verifiedProfile}
                onChange={() => setVerifiedProfile((current) => !current)}
                Icon={ShieldCheck}
              />
            </div>
          </section>

          <hr className="my-4 border-sand" />

          <section>
            <h2 className="text-base font-bold">Amenities</h2>
            <div className="mt-3 flex flex-col gap-1">
              <FilterCheckbox
                label="Instant Booking"
                checked={instantBooking}
                onChange={() => setInstantBooking((current) => !current)}
                Icon={Zap}
              />
              <FilterCheckbox
                label="Smoking allowed"
                checked={smokingAllowed}
                onChange={() => setSmokingAllowed((current) => !current)}
                Icon={Cigarette}
              />
              <FilterCheckbox label="Pets allowed" checked={petsAllowed} onChange={() => setPetsAllowed((current) => !current)} Icon={PawPrint} />
            </div>
          </section>

          <hr className="my-4 border-sand" />

          <button
            type="button"
            className="flex w-full items-center justify-between text-left text-sm font-bold text-ink"
            onClick={() => setShowMoreFilters((current) => !current)}
            aria-expanded={showMoreFilters}
          >
            More ride details
            {showMoreFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showMoreFilters && (
            <div className="mt-3 flex flex-col gap-3">
              <input className="input" value={sourceArea} onChange={(event) => setSourceArea(event.target.value)} placeholder="Pickup area, e.g. Bopal, Gota, Iscon" />
              <input className="input" value={destinationArea} onChange={(event) => setDestinationArea(event.target.value)} placeholder="Stop or drop area, e.g. Chotila, Limbdi" />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min price" />
                <input className="input" type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max price" />
              </div>
              <select className="input" value={driverRating} onChange={(event) => setDriverRating(event.target.value)}>
                <option value="">Any rating</option>
                <option value="4">4.0+ stars</option>
                <option value="4.5">4.5+ stars</option>
                <option value="4.8">4.8+ stars</option>
              </select>
              <select className="input" value={carType} onChange={(event) => setCarType(event.target.value)}>
                <option value="">All car categories</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="7 Seater">7 Seater</option>
              </select>
              <select className="input" value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
                <option value="">All fuel types</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV</option>
                <option value="Diesel">Diesel</option>
              </select>
              <select className="input" value={acAvailable} onChange={(event) => setAcAvailable(event.target.value)}>
                <option value="">AC and non-AC</option>
                <option value="true">AC only</option>
                <option value="false">Non-AC only</option>
              </select>
              <p className="text-xs text-muted">
                Close-to-point sorting uses these pickup and drop areas when you provide them.
              </p>
            </div>
          )}
        </aside>

        {/* Right: results list */}
        <div className="min-w-0">
          {!hasRoute ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Search size={40} className="text-muted/40" />
              <p className="text-base font-bold text-ink">Where are you headed?</p>
              <p className="text-sm text-muted">Enter both a pickup city and a destination to see available rides.</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h1 className="text-lg font-bold md:text-xl">
                  {source} → {destination}
                </h1>
                {data && (
                  <span className="shrink-0 text-sm text-muted">
                    {data.length} ride{data.length === 1 ? "" : "s"} available
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-3">
                {isLoading && <p className="alert-info">Loading rides...</p>}
                {data?.map((ride) => <RideListItem key={ride.id} ride={ride} />)}
                {data?.length === 0 && !isLoading &&
                  (journeyDate ? (
                    <p className="alert-warning">
                      No rides available for {new Date(journeyDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Try another date or clear the date filter.
                    </p>
                  ) : (
                    <p className="alert-warning">No rides found for this route.</p>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
