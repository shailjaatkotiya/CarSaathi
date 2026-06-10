import { Fuel } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client";

const categories = [
  { value: "Mini", icon: "M", hint: "Small city-friendly car" },
  { value: "Sedan", icon: "S", hint: "Comfortable intercity car" },
  { value: "7 Seater", icon: "7", hint: "Large family/group car" }
];

export default function AddVehicle() {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("Sedan");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    await api.post("/driver/vehicles", { ...payload, car_type: category, seats: Number(payload.seats), photo_urls: [] });
    setMessage("Vehicle added. Verification can be completed later.");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-24 md:py-10">
      <div className="card rounded-3xl p-6 md:p-8">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold">Add vehicle</h1>
            <p className="mt-2 text-muted">Add car details passengers can compare before requesting seats.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Brand</span>
              <input className="input" name="brand" defaultValue="Maruti Suzuki" />
            </label>
            <label>
              <span className="field-label">Model</span>
              <input className="input" name="model" defaultValue="Swift Dzire" />
            </label>
            <label>
              <span className="field-label">Vehicle number</span>
              <input className="input" name="vehicle_number" defaultValue="GJ01AB1234" />
            </label>
            <label>
              <span className="field-label">Fuel type</span>
              <select className="input" name="fuel_type" defaultValue="Petrol">
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="EV">EV</option>
              </select>
            </label>
            <label>
              <span className="field-label">Seats</span>
              <input className="input" name="seats" defaultValue="4" />
            </label>
          </div>

          <div>
            <h2 className="font-bold">Car category</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {categories.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCategory(item.value)}
                  className={`rounded-xl border p-4 text-left transition ${
                    category === item.value
                      ? "border-primary bg-primary text-white"
                      : "border-sand bg-cream text-ink hover:border-primary"
                  }`}
                >
                  <p className="font-bold">
                    {item.icon} · {item.value}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs">
                    <Fuel size={12} /> Fuel type selected above
                  </p>
                  <p className="text-xs">{item.hint}</p>
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary self-start px-6 py-3 text-base" type="submit">
            Save vehicle
          </button>
          {message && <p className="alert-success">{message}</p>}
        </form>
      </div>
    </div>
  );
}
