import { queryOptions } from "@tanstack/react-query";
import { fetchJson } from "./http";

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
  sourceUrl: string;
  test: boolean;
}

export interface WarningSnapshot {
  lastCheckedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  sourceAvailable: boolean;
  warnings: WarningNotice[];
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
