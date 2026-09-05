import { useEffect, useRef, useState } from "react";
import { scanApi } from "../api/client";

const POLL_INTERVAL_MS = 4000;

/**
 * Fetches a page of scan history and keeps polling (every 4s) for as long
 * as any scan on the page is still "pending" — e.g. the ML service hasn't
 * finished scoring it yet. Stops automatically once nothing is pending, so
 * a fully-scored page doesn't keep hitting the API forever.
 */
export function usePolledHistory(page, limit) {
  const [scans, setScans] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOnce = async (isFirstLoad) => {
      try {
        const { data } = await scanApi.getHistory(page, limit);
        if (cancelled) return;
        setScans(data.scans);
        setTotalPages(data.totalPages || 1);
        setError("");

        const stillPending = data.scans.some((s) => s.status === "pending");
        if (stillPending && !intervalRef.current) {
          intervalRef.current = setInterval(() => fetchOnce(false), POLL_INTERVAL_MS);
        } else if (!stillPending && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } catch {
        if (!cancelled) setError("Couldn't load scan history.");
      } finally {
        if (isFirstLoad && !cancelled) setLoading(false);
      }
    };

    setLoading(true);
    fetchOnce(true);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [page, limit]);

  return { scans, totalPages, loading, error };
}
