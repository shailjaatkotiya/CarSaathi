export default function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
