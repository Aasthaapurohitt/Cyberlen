import { useState } from "react";
import ScanRow from "../components/ScanRow.jsx";
import { usePolledHistory } from "../hooks/usePolledHistory.js";

export default function History() {
  const [page, setPage] = useState(1);
  const { scans, totalPages, loading, error } = usePolledHistory(page, 20);
  const pendingCount = scans.filter((s) => s.status === "pending").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <h1 className="font-mono text-xl font-semibold text-text-primary">Scan history</h1>
      <p className="mt-1 text-sm text-text-muted">
        Every page the extension has scanned, most recent first.
        {pendingCount > 0 && (
          <span className="text-accent"> {pendingCount} still scoring — refreshing automatically…</span>
        )}
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-text-muted">Loading…</p>
      ) : error ? (
        <p className="mt-8 text-sm text-verdict-high">{error}</p>
      ) : (
        <>
          <div className="mt-6 border border-border bg-surface">
            {scans.map((scan) => (
              <ScanRow key={scan._id} scan={scan} />
            ))}
            {scans.length === 0 && (
              <p className="px-4 py-6 text-sm text-text-muted">No scans on this page.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-xs text-text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text-primary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
