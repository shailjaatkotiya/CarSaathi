import { ChevronDown, ChevronUp, Search, SlidersHorizontal, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, Ride } from "../api/client";
import RideListItem from "../components/RideListItem";
import TimePicker from "../components/TimePicker";
import TravelDatePicker, { clampTravelDate } from "../components/TravelDatePicker";

export default function SearchRides() {
  const [searchParams] = useSearchParams();
  const [source, setSource] = useState(searchParams.get("source") || "");
  const [destination, setDestination] = useState(searchParams.get("destination") || "");
  const [sourceArea, setSourceArea] = useState("");
  const [destinationArea, setDestinationArea] = useState("");
  const [journeyDate, setJourneyDate] = useState(clampTravelDate(searchParams.get("date")));
  const [departureAfter, setDepartureAfter] = useState("");
  const [departureBefore, setDepartureBefore] = useState("");
  const [carType, setCarType] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [driverRating, setDriverRating] = useState("");
  const [acAvailable, setAcAvailable] = useState("");
  const [sortBy, setSortBy] = useState("date_time");
  const [seats, setSeats] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [
      "rides",
      source,
      destination,
      sourceArea,
      destinationArea,
      journeyDate,
      departureAfter,
      departureBefore,
      carType,
      fuelType,
      minPrice,
      maxPrice,
      driverRating,
      acAvailable,
      sortBy,
      seats
    ],
    queryFn: async () => {
      const response = await api.get<Ride[]>("/passenger/rides/search", {
        params: {
          source: source.trim() || undefined,
          destination: destination.trim() || undefined,
          source_area: sourceArea || undefined,
          destination_area: destinationArea || undefined,
          journey_date: journeyDate || undefined,
          departure_after: departureAfter || undefined,
          departure_before: departureBefore || undefined,
          car_type: carType || undefined,
          fuel_type: fuelType || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          driver_rating: driverRating || undefined,
          ac_available: acAvailable || undefined,
          sort_by: sortBy,
          seats
        }
      });
      return response.data;
    }
  });

  function clearFilters() {
    setSortBy("date_time");
    setSourceArea("");
    setDestinationArea("");
    setDepartureAfter("");
    setDepartureBefore("");
    setCarType("");
    setFuelType("");
    setMinPrice("");
    setMaxPrice("");
    setDriverRating("");
    setAcAvailable("");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 md:py-6">
      {/* Top search bar: pickup, drop off, date, passengers */}
      <div className="card flex flex-col gap-2 rounded-2xl p-2 md:flex-row md:items-stretch md:gap-0 md:divide-x md:divide-sand">
        <label className="flex flex-1 flex-col justify-center px-3 py-2">
          <span className="field-label mb-0">From</span>
          <input
            className="w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Pickup city"
          />
        </label>
        <label className="flex flex-1 flex-col justify-center px-3 py-2">
          <span className="field-label mb-0">To</span>
          <input
            className="w-full bg-transparent text-sm font-bold text-ink outline-none placeholder:font-normal placeholder:text-muted"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Drop off city"
          />
        </label>
        <div className="flex items-center px-2 md:w-[160px]">
          <TravelDatePicker value={journeyDate} onChange={setJourneyDate} label="Date" />
        </div>
        <label className="flex flex-col justify-center px-3 py-2 md:w-[150px]">
          <span className="field-label mb-0">Passengers</span>
          <span className="flex items-center gap-2">
            <Users size={15} className="text-muted" />
            <input
              className="w-full bg-transparent text-sm font-bold text-ink outline-none"
              type="number"
              min={1}
              value={seats}
              onChange={(event) => setSeats(Math.max(1, Number(event.target.value)))}
            />
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

      <div className="mt-3 grid gap-4 lg:mt-4 lg:grid-cols-[260px_1fr]">
        {/* Left sidebar: sort + filters. Hidden on mobile until toggled, always shown on desktop. */}
        <aside className={`card h-max rounded-2xl p-4 lg:sticky lg:top-4 lg:block ${showFilters ? "block" : "hidden"}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Sort by</h2>
            <button type="button" className="text-xs font-bold text-muted transition hover:text-primary" onClick={clearFilters}>
              Clear all
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {[
              ["date_time", "Earliest departure"],
              ["time", "Departure time"],
              ["price", "Lowest price"]
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-sm transition hover:bg-sand-light"
                onClick={() => setSortBy(value)}
              >
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                    sortBy === value ? "border-primary" : "border-sand"
                  }`}
                >
                  {sortBy === value && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span className={sortBy === value ? "font-bold text-ink" : "text-muted"}>{label}</span>
              </button>
            ))}
          </div>

          <hr className="my-4 border-sand" />

          <h2 className="text-base font-bold">Filters</h2>
          <div className="mt-3 flex flex-col gap-3">
            <label>
              <span className="field-label">Pickup area</span>
              <input className="input" value={sourceArea} onChange={(event) => setSourceArea(event.target.value)} placeholder="Bopal, Gota, Iscon" />
            </label>
            <label>
              <span className="field-label">Stop or drop area</span>
              <input className="input" value={destinationArea} onChange={(event) => setDestinationArea(event.target.value)} placeholder="Chotila, Limbdi" />
            </label>
            <div className="flex flex-col gap-2">
              <TimePicker value={departureAfter} onChange={setDepartureAfter} label="After" />
              <TimePicker value={departureBefore} onChange={setDepartureBefore} label="Before" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="field-label">Min price</span>
                <input className="input" type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="150" />
              </label>
              <label>
                <span className="field-label">Max price</span>
                <input className="input" type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="650" />
              </label>
            </div>
            <label>
              <span className="field-label">Min driver rating</span>
              <select className="input" value={driverRating} onChange={(event) => setDriverRating(event.target.value)}>
                <option value="">Any rating</option>
                <option value="4">4.0+ stars</option>
                <option value="4.5">4.5+ stars</option>
                <option value="4.8">4.8+ stars</option>
              </select>
            </label>
            <label>
              <span className="field-label">Car category</span>
              <select className="input" value={carType} onChange={(event) => setCarType(event.target.value)}>
                <option value="">All car categories</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="7 Seater">7 Seater</option>
              </select>
            </label>
            <label>
              <span className="field-label">Fuel type</span>
              <select className="input" value={fuelType} onChange={(event) => setFuelType(event.target.value)}>
                <option value="">All fuel types</option>
                <option value="Petrol">Petrol</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV</option>
                <option value="Diesel">Diesel</option>
              </select>
            </label>
            <label>
              <span className="field-label">AC preference</span>
              <select className="input" value={acAvailable} onChange={(event) => setAcAvailable(event.target.value)}>
                <option value="">AC and non-AC</option>
                <option value="true">AC only</option>
                <option value="false">Non-AC only</option>
              </select>
            </label>
          </div>
        </aside>

        {/* Right: results list */}
        <div className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h1 className="text-lg font-bold md:text-xl">
              {source || "All cities"} {destination ? `-> ${destination}` : ""}
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
            {data?.length === 0 &&
              (journeyDate ? (
                <p className="alert-warning">
                  No rides available for {new Date(journeyDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. Try another date or clear the date filter.
                </p>
              ) : (
                <p className="alert-warning">No rides found for this route.</p>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
