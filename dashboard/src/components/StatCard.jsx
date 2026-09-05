export default function StatCard({ label, value, accent }) {
  return (
    <div className="border border-border bg-surface p-5">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className="mt-2 font-mono text-3xl font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
