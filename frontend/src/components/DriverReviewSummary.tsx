import { Star } from "lucide-react";
import type { DriverProfile } from "../types";

export default function DriverReviewSummary({
  profile,
  compact = false,
  limit,
  textList = false,
}: {
  profile?: DriverProfile;
  compact?: boolean;
  limit?: number;
  textList?: boolean;
}) {
  if (!profile) {
    return <p className="text-xs text-muted">Loading driver reviews...</p>;
  }

  const allReviews = profile.reviews ?? [];
  const ratingText =
    profile.rating_count > 0
      ? `${profile.rating_average} rating from ${profile.rating_count} reviews`
      : "No reviews yet";
  const reviews = limit ? allReviews.slice(0, limit) : allReviews;

  return (
    <div className={compact ? "mt-2" : ""}>
      <div className="flex items-center gap-1.5 text-xs font-bold md:text-sm">
        <Star
          size={13}
          strokeWidth={2.5}
          fill="currentColor"
          className="text-primary"
        />
        <span>{ratingText}</span>
      </div>
      {reviews.length > 0 && (
        <div className={textList ? "mt-2 space-y-1.5" : "mt-2 flex flex-col gap-1.5"}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className={textList ? "border-t border-sand-light pt-2 first:border-t-0 first:pt-0" : "rounded-lg bg-cream px-2.5 py-2"}
            >
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <span>{review.reviewer_name}</span>
                <span className="text-muted">on {review.route}</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  <Star size={10} strokeWidth={2.5} fill="currentColor" />
                  {review.rating}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {review.comment || "No written review."}
              </p>
            </div>
          ))}
        </div>
      )}
      {reviews.length === 0 && profile.rating_count > 0 && (
        <p className="mt-2 text-xs text-muted">No written review text yet.</p>
      )}
    </div>
  );
}
