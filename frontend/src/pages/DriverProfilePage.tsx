import { ChevronDown, ChevronUp, Star, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { profileApi } from "../api/profile";
import DriverReviewSummary from "../components/DriverReviewSummary";
import { queryKeys } from "../lib/queryKeys";

export default function DriverProfilePage() {
  const { driverId } = useParams();
  const [reviewsOpen, setReviewsOpen] = useState(true);
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.profile.driver(driverId ?? ""),
    queryFn: () => profileApi.driver(driverId!),
    enabled: Boolean(driverId),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <p className="alert-info">Loading driver profile...</p>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        <p className="alert-warning">Driver profile could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-4">
      <div className="flex flex-col gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-primary text-white">
              <UserRound size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold">{profile.full_name}</h1>
              <p className="mt-0.5 text-xs text-muted">Driver profile</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted">
            Reviews
          </h2>
          <div className="card divide-y divide-sand-light overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-sand-light"
              onClick={() => setReviewsOpen((current) => !current)}
            >
              <Star size={16} className="shrink-0 text-muted" />
              <div className="flex-1">
                <span className="block text-sm font-semibold">Rating</span>
                <span className="block text-xs text-muted">
                  {profile.rating_average || 0} rating from{" "}
                  {profile.rating_count || 0} reviews
                </span>
              </div>
              {reviewsOpen ? (
                <ChevronUp size={16} className="shrink-0 text-muted" />
              ) : (
                <ChevronDown size={16} className="shrink-0 text-muted" />
              )}
            </button>
            {reviewsOpen && (
              <div className="px-4 pb-3">
                <DriverReviewSummary profile={profile} compact textList />
              </div>
            )}
          </div>
        </div>

        <Link to="/search" className="btn-outline self-start">
          Back to rides
        </Link>
      </div>
    </div>
  );
}
