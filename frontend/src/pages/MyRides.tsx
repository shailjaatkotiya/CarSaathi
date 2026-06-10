import { XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api, Ride } from "../api/client";
import RideCard from "../components/RideCard";

export default function MyRides() {
  const [message, setMessage] = useState("");
  const { data, refetch } = useQuery({
    queryKey: ["my-rides"],
    queryFn: async () => (await api.get<Ride[]>("/driver/rides")).data
  });

  async function cancelRide(rideId: number) {
    await api.post(`/driver/rides/${rideId}/cancel`, { reason: "Driver cancelled from app" });
    setMessage("Ride cancelled. WhatsApp cancellation messages have been logged for booked passengers.");
    refetch();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold">Driver - My rides</h1>
        {message && <p className="alert-success">{message}</p>}
        {data?.map((ride) => (
          <div key={ride.id} className="flex flex-col gap-3">
            <RideCard ride={ride} />
            {ride.status !== "cancelled" && (
              <button type="button" className="btn-danger self-start" onClick={() => cancelRide(ride.id)}>
                <XCircle size={16} />
                Cancel ride and notify passengers on WhatsApp
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
