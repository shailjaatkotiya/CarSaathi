import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ verified }: { verified: boolean }) {
  // Pending/unverified state is intentionally not surfaced in the UI yet; the
  // badge only appears once Aadhaar verification is complete.
  if (!verified) {
    return null;
  }
  return (
    <span className="chip-solid">
      <BadgeCheck size={14} />
      Verified
    </span>
  );
}
