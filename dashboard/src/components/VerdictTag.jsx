const VERDICT_STYLES = {
  safe: { color: "#3FBF8B", label: "Safe" },
  "low risk": { color: "#4FB8C4", label: "Low risk" },
  "medium risk": { color: "#E3A73E", label: "Medium risk" },
  "high risk": { color: "#E5484D", label: "High risk" },
};

export default function VerdictTag({ verdict }) {
  const style = VERDICT_STYLES[verdict] || VERDICT_STYLES.safe;
  return (
    <span className="inline-flex items-center gap-2 font-mono text-sm">
      <span
        className="inline-block h-2.5 w-2.5"
        style={{ backgroundColor: style.color }}
        aria-hidden="true"
      />
      {style.label}
    </span>
  );
}
