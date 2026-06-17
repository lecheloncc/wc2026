"use client";

import { useEffect, useState } from "react";

/**
 * Reactive Date.now() — re-renders every `intervalMs` (default 30 s).
 * Use anywhere a "locked" / "deadline" check would otherwise read Date.now()
 * directly: that read is computed once per render and stays stale until the
 * user interacts. With this hook, the lock auto-applies within `intervalMs`
 * of kickoff without requiring a manual refresh.
 *
 * No-ops on the server (returns the SSR timestamp once).
 */
export function useNow(intervalMs: number = 30_000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
