import BookedRidesList from "../components/BookedRidesList";
import SavedPassengersManager from "../components/SavedPassengersManager";

export default function PassengerProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 md:py-7">
      <div className="flex flex-col gap-3">
        <div className="card-soft rounded-2xl p-4 md:p-5">
          <h1 className="text-xl font-bold md:text-2xl">Booked Rides</h1>
          <p className="mt-1 text-sm text-muted">Your booked rides that are not completed yet.</p>
        </div>
        <SavedPassengersManager />
        <BookedRidesList />
      </div>
    </div>
  );
}
