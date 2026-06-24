import PublishedRidesList from "../components/PublishedRidesList";

export default function MyRides() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-5 md:py-7">
      <div className="flex flex-col gap-3">
        <div className="card-soft rounded-2xl p-4 md:p-5">
          <h1 className="text-xl font-bold md:text-2xl">Published Rides</h1>
        </div>
        <PublishedRidesList />
      </div>
    </div>
  );
}
