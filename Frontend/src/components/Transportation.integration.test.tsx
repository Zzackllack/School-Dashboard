// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "#/lib/api/http";

import Transportation from "./Transportation";

/**
 * The default theme's transport panel. Like the brutalist module's companion
 * suite, this drives the real queries instead of mocking them, because the
 * stop selection and error precedence are exactly what moved out of effects.
 */
vi.mock("#/lib/api/http", () => ({
  fetchJson: vi.fn(),
}));

const STOP = {
  type: "stop",
  id: "100000001",
  name: "Goethestr./Drakestr.",
  location: {
    type: "location",
    id: "loc1",
    latitude: 52.434,
    longitude: 13.305,
  },
  products: {
    suburban: false,
    subway: false,
    tram: false,
    bus: true,
    ferry: false,
    express: false,
    regional: false,
  },
  distance: 90,
};

const S_BAHN_STOP = {
  ...STOP,
  id: "900000001",
  name: "S Lichterfelde West",
  products: { ...STOP.products, suburban: true },
  distance: 150,
};

function departureIn(minutes: number, product = "bus") {
  const when = new Date(Date.now() + minutes * 60_000).toISOString();
  return {
    tripId: `trip-${product}-${minutes}`,
    direction: product === "suburban" ? "S Oranienburg" : "U Dahlem-Dorf",
    line: {
      type: "line",
      id: `line-${product}`,
      name: product === "suburban" ? "S 25" : "M11",
      mode: product,
      product,
    },
    when,
    plannedWhen: when,
    delay: null,
    platform: null,
    plannedPlatform: null,
    stop,
  };
}

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Transportation />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(fetchJson).mockReset();
});

afterEach(() => {
  cleanup();
});

describe("transportation panel data states", () => {
  it("renders bus and S-Bahn departures for the nearest stops", async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/nearby")) return [STOP, S_BAHN_STOP];
      if (url.includes(`${S_BAHN_STOP.id}/`))
        return { departures: [departureIn(4, "suburban")] };
      if (url.includes(`${STOP.id}/`)) return { departures: [departureIn(2)] };
      throw new Error(`unexpected request: ${url}`);
    });

    renderPanel();

    expect(await screen.findByText("M11")).toBeDefined();
    expect(screen.getByText("S 25")).toBeDefined();
    // Stop names sit next to a "Station: " label inside the same <p>, so match
    // on a fragment rather than the whole element text.
    expect(screen.getByText(/Goethestr\.\/Drakestr\./)).toBeDefined();
    expect(screen.getByText(/S Lichterfelde West/)).toBeDefined();
    expect(screen.queryByText("Lade Abfahrten...")).toBeNull();
  });

  it("shows the empty state once loading has settled", async () => {
    // Regression guard: with no nearby stop, the departures queries are disabled
    // and therefore must not report as loading, or this never leaves the
    // "Lade Abfahrten..." branch.
    vi.mocked(fetchJson).mockResolvedValue([]);

    renderPanel();

    expect(
      await screen.findByText("Momentan keine Abfahrten verfügbar."),
    ).toBeDefined();
    // The bus table falls through to the empty state; the S-Bahn table has a
    // more specific reason to be empty and says so instead.
    expect(screen.getByText("No S-Bahn stations found nearby.")).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText("Lade Abfahrten...")).toBeNull();
    });
  });

  it("reports a nearby-stops failure without claiming departures are loading", async () => {
    vi.mocked(fetchJson).mockRejectedValue(new Error("upstream down"));

    renderPanel();

    expect(
      await screen.findByText(
        "Failed to load nearby stops. Please try again later.",
      ),
    ).toBeDefined();
    await waitFor(() => {
      expect(screen.queryByText("Lade Abfahrten...")).toBeNull();
    });
  });

  it("keeps a genuine departures failure from being replaced by the nearby-stops message", async () => {
    // The nearby effect used to write into the same error slot as the departures
    // fetch, so whichever ran last won and a real failure could be reported as
    // "could not load nearby stops".
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/nearby")) return [STOP];
      throw new Error("bus endpoint 500");
    });

    renderPanel();

    expect(
      await screen.findByText(
        "Problem beim Laden der Abfahrten. Bitte später erneut versuchen, oder Cédric kontaktieren.",
      ),
    ).toBeDefined();
    expect(
      screen.queryByText(
        "Failed to load nearby stops. Please try again later.",
      ),
    ).toBeNull();
  });

  it("falls back to the S-Bahn-station message when no S-Bahn stop is nearby", async () => {
    vi.mocked(fetchJson).mockImplementation(async (url: string) => {
      if (url.includes("/nearby")) return [STOP];
      return { departures: [departureIn(2)] };
    });

    renderPanel();

    expect(await screen.findByText("M11")).toBeDefined();
    expect(screen.getByText("No S-Bahn stations found nearby.")).toBeDefined();
  });

  it("shows a dash instead of a running clock before the first successful fetch", async () => {
    vi.mocked(fetchJson).mockResolvedValue([]);

    renderPanel();

    // The footer used to fall back to `new Date()`, so with no data it
    // re-rendered a live "last updated" timestamp on every pass.
    expect(await screen.findByText(/Zuletzt aktualisiert:/)).toBeDefined();
    expect(screen.getByText(/Zuletzt aktualisiert: –/)).toBeDefined();
  });
});
