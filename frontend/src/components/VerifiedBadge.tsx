import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span className={verified ? "chip-solid" : "chip-outline"}>
      <BadgeCheck size={14} />
      {verified ? "Verified" : "Pending"}
    </span>
  );
}
