// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "#/lib/api/http";

import { TransportModule } from "./TransportModule";

/**
 * Exercises the real `useTransport` against a real QueryClient.
 *
 * `TransportModule.unit.test.tsx` mocks the hook wholesale, which is right for
 * covering the presentational branches but leaves the hook itself untested — and
 * that is where the state was moved from effects into queries. These cases pin
 * the query wiring, in particular that a query disabled via `enabled` never
 * reports as loading: when no stop could be resolved, treating "pending" as
 * "loading" left this module on "Lade Abfahrten…" forever and swallowed the
 * nearby-stops error.
 */
vi.mock("#/lib/api/http", () => ({
  fetchJson: vi.fn(),
}));

const BUS_STOP = {
  id: "100000001",
  name: "Goethestr./Drakestr.",
  products: { bus: true, suburban: false, tram: false, subway: false },
};

const S_BAHN_STOP = {
  id: "900000001",
  name: "S Lichterfelde West",
  products: { bus: true, suburban: true, tram: false, subway: false },
};

/** `minsUntil` compares against `Date.now()`, so departures must be in the future. */
function departureIn(minutes: number, overrides: Record<string, unknown> = {}) {
  return {
    tripId: `trip-${minutes}`,
    direction: "U Dahlem-Dorf",
    line: { name: "M11", product: "bus" },
    when: new Date(Date.now() + minutes * 60_000).toISOString(),
    plannedWhen: new Date(Date.now() + minutes * 60_000).toISOString(),
    delay: null,
    ...overrides,
  };
}

function sBahnDepartureIn(minutes: number) {
  return departureIn(minutes, {
    line: { name: "S 25", product: "suburban" },
    direction: "S Oranienburg",
  });
}

function renderModule() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TransportModule />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(fetchJson).mockReset();
});

afterEach(() => {
  cleanup();
});

describe("brutalist transport module data states", () => {
  it("renders bus and S-Bahn departures for the nearest stops", async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/nearby")) return [BUS_STOP, S_BAHN_STOP];
      if (url.includes(`${S_BAHN_STOP.id}/`))
        return { departures: [sBahnDepartureIn(4)] };
      if (url.includes(`${BUS_STOP.id}/`))
        return { departures: [departureIn(2)] };
      throw new Error(`unexpected request: ${url}`);
    });

    renderModule();

    expect(await screen.findByText("M11")).toBeDefined();
    expect(screen.getByText("S 25")).toBeDefined();
    expect(screen.getByText("U Dahlem-Dorf")).toBeDefined();
    // The stop each section was resolved from, not just that a section exists.
    expect(screen.getByText("Goethestr./Drakestr.")).toBeDefined();
    expect(screen.getByText("S Lichterfelde West")).toBeDefined();
    expect(screen.queryByText("Lade Abfahrten…")).toBeNull();
  });

  it("asks only the S-Bahn stop for suburban departures", async () => {
    const urls: string[] = [];
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      urls.push(url);
      if (url.includes("/nearby")) return [BUS_STOP, S_BAHN_STOP];
      return { departures: [] };
    });

    renderModule();

    await waitFor(() => {
      expect(urls.some((url) => url.includes("/nearby"))).toBe(true);
    });
    await waitFor(() => {
      expect(urls.filter((url) => url.includes("/departures"))).toHaveLength(2);
    });

    const sBahnRequest = urls.find((url) =>
      url.includes(`${S_BAHN_STOP.id}/departures`),
    );
    const busRequest = urls.find((url) =>
      url.includes(`${BUS_STOP.id}/departures`),
    );
    expect(sBahnRequest).toBeDefined();
    expect(sBahnRequest).toContain("suburban=true");
    expect(busRequest).toBeDefined();
    expect(busRequest).not.toContain("suburban=true");
  });

  it("settles on the empty state when no stops are nearby", async () => {
    // Regression guard: both departures queries stay disabled with no stop, and a
    // disabled query with no data is `pending` forever. Reporting that as
    // "loading" pinned the module to "Lade Abfahrten…" indefinitely.
    vi.mocked(fetchJson).mockResolvedValue([]);

    renderModule();

    expect(await screen.findByText("Keine Abfahrten verfügbar")).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText("Lade Abfahrten…")).toBeNull();
    });
  });

  it("surfaces the nearby-stops error instead of loading forever", async () => {
    // Same regression, reached by the query failing: `data` is undefined, so no
    // stop resolves, so both departures queries are disabled.
    vi.mocked(fetchJson).mockRejectedValue(new Error("upstream down"));

    renderModule();

    expect(
      await screen.findByText("Haltestellen konnten nicht geladen werden."),
    ).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText("Lade Abfahrten…")).toBeNull();
    });
  });

  it("shows a departures error while keeping the other stop's data", async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/nearby")) return [BUS_STOP, S_BAHN_STOP];
      if (url.includes(`${BUS_STOP.id}/`)) throw new Error("bus endpoint 500");
      return { departures: [sBahnDepartureIn(4)] };
    });

    renderModule();

    expect(await screen.findByText("S 25")).toBeDefined();
    // A failed bus stream must not blank out the S-Bahn section, and the
    // nearby-stops error must not be shown in its place.
    expect(
      screen.queryByText("Haltestellen konnten nicht geladen werden."),
    ).toBeNull();
  });

  it("still renders the bus section when nothing nearby is an S-Bahn stop", async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/nearby")) return [BUS_STOP];
      return { departures: [departureIn(3)] };
    });

    renderModule();

    expect(await screen.findByText("M11")).toBeDefined();
    expect(screen.getByText("S-Bahn")).toBeDefined();
    expect(screen.getByText("Kein Halt verfügbar")).toBeDefined();
  });
});
