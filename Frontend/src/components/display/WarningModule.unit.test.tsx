// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { WarningModule } from "./WarningModule";

const warning = {
  id: "warning-module-1",
  messageType: "Alert",
  headline: "Wasserrohrbruch in Tempelhof",
  description: "Eine Information für den betroffenen Bereich.",
  instruction: "Bitte beachten Sie die Hinweise der Behörden.",
  provider: "MOWAS",
  severity: "Minor",
  urgency: "Future",
  certainty: "Likely",
  event: "Wasserrohrbruch",
  affectedAreas: ["Berlin-Tempelhof"],
  sentAt: "2026-09-10T09:40:00+02:00",
  expiresAt: null,
  sourceUrl: "https://warnung.bund.de/meldungen",
  test: false,
};

function renderModule(warnings: Array<Record<string, unknown>>) {
  const client = new QueryClient({
    defaultOptions: { queries: { enabled: false, retry: false } },
  });
  client.setQueryData(["warnings-current"], {
    lastCheckedAt: "2026-09-10T09:40:00+02:00",
    lastSuccessfulSyncAt: "2026-09-10T09:40:00+02:00",
    sourceAvailable: true,
    warnings,
  });

  return render(
    <QueryClientProvider client={client}>
      <WarningModule variant="default" />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  window.localStorage?.clear();
});

describe("WarningModule", () => {
  it("renders a compact active-warning module", () => {
    renderModule([warning]);

    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("Wasserrohrbruch in Tempelhof")).toBeDefined();
    expect(screen.getByText(/Vollbild noch/)).toBeDefined();
    expect(screen.getByTestId("warning-qr-code")).toBeDefined();
  });

  it("does not render when the warning list is empty", () => {
    renderModule([]);

    expect(screen.queryByRole("status")).toBeNull();
  });
});
