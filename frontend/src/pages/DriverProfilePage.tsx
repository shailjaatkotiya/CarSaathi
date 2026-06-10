import { MessageCircle, User as UserIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

type DriverBooking = {
  id: number;
  booking_code: string;
  status: string;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  passenger_name: string;
  passenger_whatsapp?: string;
  route: string;
  journey_date: string;
  departure_time: string;
};

export default function DriverProfilePage() {
  const { data: driverBookings } = useQuery({
    queryKey: ["driver-profile-bookings"],
    queryFn: async () => (await api.get<DriverBooking[]>("/driver/bookings/active")).data
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-10">
      <div className="flex flex-col gap-5">
        <div className="card-soft rounded-3xl p-6 md:p-8">
          <h1 className="text-3xl font-bold">Driver Profile</h1>
          <p className="mt-2 text-muted">Passenger details for all non-completed bookings on your rides.</p>
        </div>

        {driverBookings?.map((booking) => (
          <div key={booking.id} className="card p-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <h3 className="font-bold">{booking.passenger_name}</h3>
                <p className="text-sm text-muted">
                  {booking.route} · {booking.journey_date} at {booking.departure_time.slice(0, 5)}
                </p>
                <p className="text-sm text-muted">
                  {booking.seats_booked} seats · {booking.pickup_point} to {booking.drop_point}
                </p>
              </div>
              <span className="chip self-start">{booking.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="chip-outline">
                <UserIcon size={14} />
                {booking.booking_code}
              </span>
              <span className="chip-outline">
                <MessageCircle size={14} />
                {booking.passenger_whatsapp || "No WhatsApp"}
              </span>
            </div>
          </div>
        ))}

        {driverBookings?.length === 0 && <p className="alert-info">No passenger details yet.</p>}
      </div>
    </div>
  );
}
