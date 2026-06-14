import { ArrowUpDown, ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";
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
  const [showSort, setShowSort] = useState(false);
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

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="flex flex-col gap-6">
        <div className="card rounded-3xl p-5 md:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={26} className="text-primary" />
                <h1 className="text-3xl font-bold md:text-4xl">Passenger ride search</h1>
              </div>
              <p className="mt-2 max-w-xl text-sm text-muted md:whitespace-nowrap">
                Pickup, drop off, date. Seat-hunting made simple.
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:min-w-[460px]">
              <button type="button" className="btn-outline w-full justify-between px-4" onClick={() => setShowSort((current) => !current)}>
                <span className="inline-flex items-center gap-2">
                  <ArrowUpDown size={18} />
                  Sort rides
                </span>
                {showSort ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button type="button" className="btn-outline w-full justify-between px-4" onClick={() => setShowFilters((current) => !current)}>
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal size={18} />
                  Filter rides
                </span>
                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button type="button" className="btn-primary w-full justify-center px-4" onClick={() => refetch()}>
                <span className="inline-flex items-center gap-2">
                  <Search size={18} />
                  Search rides
                </span>
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_220px]">
            <label>
              <span className="field-label">Pickup</span>
              <input className="input" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Enter pickup city" />
            </label>
            <label>
              <span className="field-label">Drop off</span>
              <input className="input" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Enter drop off city" />
            </label>
            <TravelDatePicker value={journeyDate} onChange={setJourneyDate} />
          </div>

          {showSort && (
            <div className="mt-4 rounded-2xl border border-sand bg-cream p-3">
              <span className="field-label">Sort rides</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["date_time", "Date"],
                  ["time", "Time"],
                  ["price", "Price"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={sortBy === value ? "btn-primary" : "btn-outline"}
                    onClick={() => setSortBy(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`mt-4 gap-4 rounded-2xl border border-sand bg-cream p-4 sm:grid-cols-2 lg:grid-cols-4 ${showFilters ? "grid" : "hidden"}`}>
            <label>
              <span className="field-label">Seats needed</span>
              <input className="input" type="number" min={1} value={seats} onChange={(event) => setSeats(Number(event.target.value))} />
            </label>
            <label>
              <span className="field-label">Pickup area</span>
              <input className="input" value={sourceArea} onChange={(event) => setSourceArea(event.target.value)} placeholder="Bopal, Gota, Iscon" />
            </label>
            <label>
              <span className="field-label">Stop or drop area</span>
              <input className="input" value={destinationArea} onChange={(event) => setDestinationArea(event.target.value)} placeholder="Chotila, Limbdi" />
            </label>
            <label>
              <span className="field-label">Departure after</span>
              <input className="input" type="time" value={departureAfter} onChange={(event) => setDepartureAfter(event.target.value)} />
            </label>
            <label>
              <span className="field-label">Departure before</span>
              <input className="input" type="time" value={departureBefore} onChange={(event) => setDepartureBefore(event.target.value)} />
            </label>
            <label>
              <span className="field-label">Minimum price</span>
              <input className="input" type="number" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Rs. 150" />
            </label>
            <label>
              <span className="field-label">Maximum price</span>
              <input className="input" type="number" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Rs. 650" />
            </label>
            <label>
              <span className="field-label">Minimum driver rating</span>
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
        </div>

        <div className="flex flex-col gap-4">
          {isLoading && <p className="alert-info">Loading rides...</p>}
          {data?.map((ride) => <RideCard key={ride.id} ride={ride} />)}
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
  );
}
