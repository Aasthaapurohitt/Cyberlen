import { useState } from "react";
import VerdictTag from "./VerdictTag.jsx";

const BORDER_COLOR = {
  safe: "#3FBF8B",
  "low risk": "#4FB8C4",
  "medium risk": "#E3A73E",
  "high risk": "#E5484D",
};

export default function ScanRow({ scan }) {
  const [open, setOpen] = useState(false);
  const borderColor = BORDER_COLOR[scan.verdict] || "#262C38";

  return (
    <div
      className="border-b border-border last:border-b-0"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full flex-col gap-2 px-4 py-3 text-left hover:bg-surface-raised sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm text-text-primary">{scan.url}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {new Date(scan.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-normal sm:gap-6">
          <span className="font-mono text-sm text-text-muted">
            {scan.riskScore ?? "—"}/100
          </span>
          <VerdictTag verdict={scan.verdict} />
          <span className="text-text-muted">{open ? "−" : "+"}</span>
        </div>
      </button>

      {open && (
        <div className="bg-surface-raised px-4 py-4">
          <p className="mb-2 text-xs text-text-muted">Why this score</p>
          {scan.reasons?.length ? (
            <ul className="space-y-1.5">
              {scan.reasons.map((reason, i) => (
                <li key={i} className="flex gap-2 text-sm text-text-primary">
                  <span className="text-text-muted">·</span>
                  {reason}
                </li>
              ))}
            </ul>
          ) : scan.status === "pending" ? (
            <p className="text-sm text-text-muted">Scan still processing…</p>
          ) : (
            <p className="text-sm text-text-muted">No explanation available.</p>
          )}
        </div>
      )}
    </div>
  );
}
