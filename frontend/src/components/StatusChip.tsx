import type { ReactNode } from "react";

// Tone per state label. Keys cover both ride and passenger-booking states.
const TONE: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  Accepted: "bg-primary-soft text-primary-dark",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Rejected: "bg-red-50 text-red-700 border border-red-200",
  Cancelled: "bg-red-50 text-red-700 border border-red-200",
};

export default function StatusChip({
  label,
  icon,
}: {
  label: string;
  icon?: ReactNode;
}) {
  const tone = TONE[label] ?? "bg-primary-soft text-primary-dark";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${tone}`}
    >
      {icon}
      {label}
    </span>
  );
}
