import PublishedRidesList from "../components/PublishedRidesList";

export default function MyRides() {
  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-3 md:px-4 md:py-7">
      <div className="flex flex-col gap-2.5 md:gap-3">
        <div className="card-soft rounded-xl p-3 md:rounded-2xl md:p-5">
          <h1 className="text-lg font-bold md:text-2xl">Published Rides</h1>
        </div>
        <PublishedRidesList />
      </div>
    </div>
  );
}
