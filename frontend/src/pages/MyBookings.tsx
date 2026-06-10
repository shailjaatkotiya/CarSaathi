import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

type Booking = {
  id: number;
  booking_code: string;
  ride_id: number;
  seats_booked: number;
  pickup_point: string;
  drop_point: string;
  status: string;
  total_amount: number;
};

export default function MyBookings() {
  const { data } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: async () => (await api.get<Booking[]>("/passenger/bookings")).data
  });

  return (
    <section className="section pb-24">
      <h1 className="text-2xl font-black">My bookings</h1>
      <div className="mt-4 grid gap-3">
        {data?.map((booking) => (
          <div key={booking.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-bold">{booking.booking_code}</p>
            <p className="text-sm text-slate-600">{booking.seats_booked} seats • {booking.pickup_point} to {booking.drop_point}</p>
            <p className="mt-2 text-sm font-semibold text-saathi-700">{booking.status} • Rs. {booking.total_amount}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
