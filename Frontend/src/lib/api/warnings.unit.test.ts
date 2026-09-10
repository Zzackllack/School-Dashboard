import { describe, expect, it } from "vitest";
import {
  formatWarningCountdown,
  getWarningAttentionState,
  getMostUrgentWarning,
  severityRank,
  type WarningNotice,
  type WarningSnapshot,
  WARNING_ATTENTION_WINDOW_MS,
  warningSnapshotQueryOptions,
} from "./warnings";

function makeWarning(id: string, severity: string | null): WarningNotice {
  return {
    id,
    messageType: "Alert",
    headline: id,
    description: "",
    instruction: "",
    provider: "MOWAS",
    severity,
    urgency: "Immediate",
    certainty: "Observed",
    event: "Gefahr",
    affectedAreas: ["Berlin"],
    sentAt: null,
    expiresAt: null,
    sourceUrl: "https://warnung.bund.de/meldungen",
    test: false,
  };
}

describe("warning API contract", () => {
  it("ranks official severity values predictably", () => {
    expect(severityRank("Extreme")).toBeGreaterThan(severityRank("Severe"));
    expect(severityRank("Severe")).toBeGreaterThan(severityRank("Minor"));
    expect(severityRank(null)).toBe(0);
  });

  it("selects the most urgent warning without mutating the source array", () => {
    const warnings = [
      makeWarning("minor", "Minor"),
      makeWarning("extreme", "Extreme"),
    ];

    expect(getMostUrgentWarning(warnings)?.id).toBe("extreme");
    expect(warnings.map((warning) => warning.id)).toEqual(["minor", "extreme"]);
  });

  it("polls independently of the dashboard's slower content refresh", () => {
    expect(warningSnapshotQueryOptions.refetchInterval).toBe(10_000);
    expect(warningSnapshotQueryOptions.staleTime).toBe(0);
  });

  it("keeps the response shape explicit", () => {
    const snapshot: WarningSnapshot = {
      lastCheckedAt: null,
      lastSuccessfulSyncAt: null,
      sourceAvailable: true,
      warnings: [],
    };

    expect(snapshot.warnings).toEqual([]);
    expect(snapshot.sourceAvailable).toBe(true);
  });

  it("keeps the full-screen attention window separate from warning lifetime", () => {
    const seenAt = 1_000_000;
    expect(
      getWarningAttentionState(seenAt, seenAt + WARNING_ATTENTION_WINDOW_MS),
    ).toEqual({ isExpanded: false, remainingMs: 0 });
    expect(formatWarningCountdown(29 * 60 * 1_000 + 4_000)).toBe("29:04");
  });
});
