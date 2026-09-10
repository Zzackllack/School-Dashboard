import { queryOptions } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { fetchJson } from "./http";

export const WARNING_ATTENTION_WINDOW_MS = 30 * 60 * 1_000;
const WARNING_SEEN_STORAGE_PREFIX = "school-dashboard:warning-seen:";

export interface WarningNotice {
  id: string;
  messageType: string | null;
  headline: string;
  description: string;
  instruction: string;
  provider: string | null;
  severity: string | null;
  urgency: string | null;
  certainty: string | null;
  event: string | null;
  affectedAreas: string[];
  sentAt: string | null;
  expiresAt: string | null;
  sourceUrl: string | null;
  test: boolean;
}

export interface WarningSnapshot {
  lastCheckedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  sourceAvailable: boolean;
  warnings: WarningNotice[];
}

function warningGroupId(warningId: string): string {
  return warningId.replace(/-\d{3}$/, "") || warningId;
}

function getStoredWarningSeenAt(warningId: string): number | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = Number(
      window.localStorage.getItem(
        `${WARNING_SEEN_STORAGE_PREFIX}${warningGroupId(warningId)}`,
      ),
    );
    return Number.isFinite(stored) && stored > 0 ? stored : null;
  } catch {
    return null;
  }
}

function storeWarningSeenAt(warningId: string, seenAt: number): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      `${WARNING_SEEN_STORAGE_PREFIX}${warningGroupId(warningId)}`,
      String(seenAt),
    );
  } catch {
    // A kiosk may block storage; the in-memory state still provides the timer.
  }
}

export function getWarningAttentionState(
  seenAt: number,
  now = Date.now(),
): { isExpanded: boolean; remainingMs: number } {
  const remainingMs = Math.max(
    0,
    WARNING_ATTENTION_WINDOW_MS - Math.max(0, now - seenAt),
  );
  return { isExpanded: remainingMs > 0, remainingMs };
}

export function formatWarningCountdown(remainingMs: number): string {
  const totalSeconds = Math.ceil(Math.max(0, remainingMs) / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function useWarningAttention(warningId: string | null) {
  const [seenAt] = useState<number | null>(() => {
    if (!warningId) return null;
    return getStoredWarningSeenAt(warningId) ?? Date.now();
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!warningId || seenAt === null) {
      return;
    }

    if (getStoredWarningSeenAt(warningId) === null) {
      storeWarningSeenAt(warningId, seenAt);
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [seenAt, warningId]);

  const state = seenAt
    ? getWarningAttentionState(seenAt, now)
    : {
        isExpanded: true,
        remainingMs: WARNING_ATTENTION_WINDOW_MS,
      };

  return {
    ...state,
    seenAt,
  };
}

export const warningSnapshotQueryOptions = queryOptions({
  queryKey: ["warnings-current"],
  queryFn: async () =>
    (await fetchJson<WarningSnapshot>("/warnings/current")) ?? {
      lastCheckedAt: null,
      lastSuccessfulSyncAt: null,
      sourceAvailable: false,
      warnings: [],
    },
  staleTime: 0,
  refetchInterval: 10_000,
  refetchIntervalInBackground: true,
  retry: 2,
});

export function severityRank(severity: string | null): number {
  switch (severity?.toLowerCase()) {
    case "extreme":
      return 4;
    case "severe":
      return 3;
    case "moderate":
      return 2;
    case "minor":
      return 1;
    default:
      return 0;
  }
}

export function getMostUrgentWarning(
  warnings: WarningNotice[],
): WarningNotice | null {
  return (
    [...warnings].sort(
      (left, right) =>
        severityRank(right.severity) - severityRank(left.severity),
    )[0] ?? null
  );
}
