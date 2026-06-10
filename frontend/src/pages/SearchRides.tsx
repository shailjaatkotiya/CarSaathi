import { Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";

export default function SearchRides() {
  const [source, setSource] = useState("Ahmedabad");
  const [destination, setDestination] = useState("Rajkot");
  const [sourceArea, setSourceArea] = useState("");
  const [destinationArea, setDestinationArea] = useState("");
  const [journeyDate, setJourneyDate] = useState("");
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
          source,
          destination,
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="flex flex-col gap-6">
        <div className="card rounded-3xl p-5 md:p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={26} className="text-primary" />
                <h1 className="text-3xl font-bold md:text-4xl">Passenger ride search</h1>
              </div>
              <p className="mt-2 max-w-3xl text-muted">
                Compare friendly car rides by city, local area, date, time, price, rating, fuel, AC, seats, and car
                category.
              </p>
            </div>
            <button type="button" className="btn-primary self-stretch md:self-center" onClick={() => refetch()}>
              <Search size={18} />
              Search rides
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="field-label">Source city</span>
              <input className="input" value={source} onChange={(event) => setSource(event.target.value)} placeholder="Ahmedabad" />
            </label>
            <label>
              <span className="field-label">Destination city</span>
              <input className="input" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="Rajkot" />
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
              <span className="field-label">Journey date</span>
              <input className="input" type="date" value={journeyDate} onChange={(event) => setJourneyDate(event.target.value)} />
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
              <span className="field-label">Seats needed</span>
              <input className="input" type="number" min={1} value={seats} onChange={(event) => setSeats(Number(event.target.value))} />
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
            <label>
              <span className="field-label">Sort rides</span>
              <select className="input" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="date_time">Sort by date</option>
                <option value="time">Sort by time</option>
                <option value="price">Sort by price</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading && <p className="alert-info">Loading rides...</p>}
          {data?.map((ride) => <RideCard key={ride.id} ride={ride} />)}
          {data?.length === 0 && <p className="alert-warning">No rides found for this route.</p>}
        </div>
      </div>
    </div>
  );
}
