// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WarningOverlay } from "./WarningOverlay";

function renderOverlay(warnings: Array<Record<string, unknown>>) {
  const client = new QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false } },
  });
  client.setQueryData(["warnings-current"], {
    lastCheckedAt: "2026-09-09T02:15:00+02:00",
    lastSuccessfulSyncAt: "2026-09-09T02:15:00+02:00",
    sourceAvailable: true,
    warnings,
  });

  return render(
    <QueryClientProvider client={client}>
      <WarningOverlay />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("WarningOverlay", () => {
  it("renders a high-contrast, accessible warning without interpreting text as HTML", () => {
    renderOverlay([
      {
        id: "warning-1",
        messageType: "Alert",
        headline: "Starke Rauchentwicklung",
        description: "Bleiben Sie im Gebäude.",
        instruction: "Fenster schließen.",
        provider: "Berliner Feuerwehr",
        severity: "Severe",
        urgency: "Immediate",
        certainty: "Observed",
        event: "Brand",
        affectedAreas: ["Berlin-Lichterfelde"],
        sentAt: "2026-09-09T02:15:00+02:00",
        expiresAt: null,
        sourceUrl: "https://warnung.bund.de/meldungen",
        test: false,
      },
    ]);

    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText("Starke Rauchentwicklung")).toBeDefined();
    expect(screen.getByText("Fenster schließen.")).toBeDefined();
    expect(screen.getByText("Berlin-Lichterfelde")).toBeDefined();
    expect(screen.queryByText("<script>")).toBeNull();
  });

  it("stays absent when no warning is active", () => {
    renderOverlay([]);

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
