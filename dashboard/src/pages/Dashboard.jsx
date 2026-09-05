import StatCard from "../components/StatCard.jsx";
import RiskTrendChart from "../components/RiskTrendChart.jsx";
import ScanRow from "../components/ScanRow.jsx";
import { usePolledHistory } from "../hooks/usePolledHistory.js";

export default function Dashboard() {
  const { scans, loading, error } = usePolledHistory(1, 50);

  const totalScans = scans.length;
  const highRiskCount = scans.filter((s) => s.verdict === "high risk").length;
  const avgRisk = totalScans
    ? Math.round(scans.reduce((sum, s) => sum + (s.riskScore || 0), 0) / totalScans)
    : 0;
  const pendingCount = scans.filter((s) => s.status === "pending").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
      <h1 className="font-mono text-xl font-semibold text-text-primary">Overview</h1>
      <p className="mt-1 text-sm text-text-muted">
        Recent scans reported by the browser extension.
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
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total scans" value={totalScans} />
            <StatCard label="High-risk detections" value={highRiskCount} accent="#E5484D" />
            <StatCard label="Average risk score" value={`${avgRisk}/100`} />
          </div>

          <div className="mt-6">
            <RiskTrendChart scans={scans} />
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs text-text-muted">Most recent scans</p>
            <div className="border border-border bg-surface">
              {scans.slice(0, 5).map((scan) => (
                <ScanRow key={scan._id} scan={scan} />
              ))}
              {scans.length === 0 && (
                <p className="px-4 py-6 text-sm text-text-muted">
                  No scans yet. Install the extension and browse to a page to see results here.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
