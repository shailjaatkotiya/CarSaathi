import { Car, Fuel, Pencil } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api } from "../api/client";
import { carBrands } from "../data/carBrands";

const categories = [
  { value: "Sedan", icon: "S", hint: "Default 3 passenger seats" },
  { value: "SUV", icon: "SUV", hint: "Default 3 passenger seats" },
  { value: "7 Seater", icon: "7", hint: "Default 6 passenger seats" }
];

type Vehicle = {
  id: number;
  brand: string;
  model: string;
  vehicle_number: string;
  fuel_type: string;
  car_type: string;
  seats: number;
  photo_urls: string[];
  is_verified: boolean;
};

function defaultPassengerSeats(carType: string) {
  return carType.toLowerCase().includes("7") ? 6 : 3;
}

export default function AddVehicle() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Sedan");
  const [passengerSeats, setPassengerSeats] = useState(defaultPassengerSeats("Sedan"));
  const [brand, setBrand] = useState("Maruti Suzuki");
  const [customBrand, setCustomBrand] = useState("");
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const { data: vehicles, refetch } = useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => (await api.get<Vehicle[]>("/driver/vehicles")).data
  });

  function chooseCategory(value: string) {
    setCategory(value);
    setPassengerSeats(defaultPassengerSeats(value));
  }

  function startEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setCategory(vehicle.car_type);
    setPassengerSeats(vehicle.seats);
    if (carBrands.includes(vehicle.brand)) {
      setBrand(vehicle.brand);
      setCustomBrand("");
    } else {
      setBrand("Other");
      setCustomBrand(vehicle.brand);
    }
    setMessage("");
    const form = formRef.current;
    if (form) {
      (form.elements.namedItem("model") as HTMLInputElement).value = vehicle.model;
      (form.elements.namedItem("vehicle_number") as HTMLInputElement).value = vehicle.vehicle_number;
      (form.elements.namedItem("fuel_type") as HTMLSelectElement).value = vehicle.fuel_type;
      form.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const resolvedBrand = brand === "Other" ? customBrand.trim() : brand;
    const body = { ...payload, brand: resolvedBrand, car_type: category, seats: passengerSeats, photo_urls: [] };
    if (editingVehicle) {
      await api.put(`/driver/vehicles/${editingVehicle.id}`, body);
      setMessage("Vehicle updated.");
      setEditingVehicle(null);
    } else {
      await api.post("/driver/vehicles", body);
      setMessage("Vehicle added. Verification can be completed later.");
    }
    refetch();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
      <div className="card rounded-3xl p-6 md:p-8">
        <form ref={formRef} onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">{editingVehicle ? `Edit vehicle ${editingVehicle.vehicle_number}` : "Add vehicle"}</h1>
            <p className="mt-2 text-muted">Add car details passengers can compare before requesting seats.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Brand</span>
              <select className="input" value={brand} onChange={(event) => setBrand(event.target.value)} required>
                {carBrands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              {brand === "Other" && (
                <input
                  className="input mt-2"
                  value={customBrand}
                  onChange={(event) => setCustomBrand(event.target.value)}
                  placeholder="Enter brand name"
                  required
                />
              )}
            </label>
            <label>
              <span className="field-label">Model</span>
              <input className="input" name="model" defaultValue="Swift Dzire" required />
            </label>
            <label>
              <span className="field-label">Vehicle number</span>
              <input className="input" name="vehicle_number" defaultValue="GJ01AB1234" required />
            </label>
            <label>
              <span className="field-label">Fuel type</span>
              <select className="input" name="fuel_type" defaultValue="Petrol" required>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV</option>
              </select>
            </label>
            <label>
              <span className="field-label">Passenger seats</span>
              <input
                className="input"
                name="seats"
                type="number"
                min={1}
                max={defaultPassengerSeats(category)}
                value={passengerSeats}
                onChange={(event) => setPassengerSeats(Number(event.target.value))}
              />
              <span className="field-hint">{category === "7 Seater" ? "7 Seater default is 6" : "Sedan and SUV default is 3"}</span>
            </label>
          </div>

          <div>
            <h2 className="font-bold">Car category</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => chooseCategory(item.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    category === item.value
                      ? "border-primary bg-primary text-white"
                      : "border-sand bg-cream text-ink hover:border-primary"
                  }`}
                >
                  <p className="font-bold">
                    {item.icon} - {item.value}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs">
                    <Fuel size={12} /> Fuel type selected above
                  </p>
                  <p className="text-xs">{item.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-primary self-start px-6 py-3 text-base" type="submit">
              {editingVehicle ? "Update vehicle" : "Save vehicle"}
            </button>
            {editingVehicle && (
              <button type="button" className="btn-outline" onClick={() => setEditingVehicle(null)}>
                Cancel edit
              </button>
            )}
          </div>
          {message && <p className="alert-success">{message}</p>}
        </form>
      </div>

      <div className="card mt-6 overflow-hidden rounded-3xl">
        <div className="border-b border-sand px-5 py-4 font-bold">My vehicles</div>
        {vehicles?.map((vehicle) => (
          <div key={vehicle.id} className="flex flex-col gap-2 border-b border-sand-light px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 font-semibold">
                <Car size={16} className="text-primary" />
                {vehicle.brand} {vehicle.model} - {vehicle.vehicle_number}
              </p>
              <p className="text-sm text-muted">
                {vehicle.car_type} - {vehicle.fuel_type} - {vehicle.seats} passenger seats
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="chip">{vehicle.is_verified ? "verified" : "not verified"}</span>
              <button type="button" className="btn-outline" onClick={() => startEdit(vehicle)}>
                <Pencil size={14} />
                Edit
              </button>
            </div>
          </div>
        ))}
        {vehicles?.length === 0 && <p className="px-5 py-4 text-sm text-muted">No vehicles added yet.</p>}
      </div>
    </div>
  );
}
