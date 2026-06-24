import BookedRidesList from "../components/BookedRidesList";

export default function PassengerProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-3 md:px-4 md:py-7">
      <div className="flex flex-col gap-2.5 md:gap-3">
        <div className="card-soft rounded-xl p-3 md:rounded-2xl md:p-5">
          <h1 className="text-lg font-bold md:text-2xl">Booked Rides</h1>
          <p className="mt-0.5 text-xs text-muted md:mt-1 md:text-sm">Your active booked rides.</p>
        </div>
        <BookedRidesList />
      </div>
    </div>
  );
}
