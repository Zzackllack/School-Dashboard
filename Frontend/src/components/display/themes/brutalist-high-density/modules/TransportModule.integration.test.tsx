// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TransportModule } from "./TransportModule";

const nearbyStopsFixture = [
  {
    id: "bus-stop",
    name: "Goethestr./Drakestr.",
    products: { bus: true, suburban: false },
  },
  {
    id: "sbahn-stop",
    name: "S Lichterfelde West",
    products: { bus: true, suburban: true },
  },
];

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

describe("Brutalist transport module integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads bus and S-Bahn departures from separate nearby stops", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input) => {
        const url = String(input);
        if (url.includes("/locations/nearby")) {
          return new Response(JSON.stringify(nearbyStopsFixture), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.includes("/stops/bus-stop/departures")) {
          return new Response(
            JSON.stringify({
              departures: [
                {
                  tripId: "bus-1",
                  direction: "U Dahlem-Dorf",
                  line: { name: "M11", product: "bus" },
                  when: new Date(Date.now() + 5 * 60_000).toISOString(),
                  plannedWhen: new Date(Date.now() + 5 * 60_000).toISOString(),
                  delay: null,
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        if (url.includes("/stops/sbahn-stop/departures")) {
          return new Response(
            JSON.stringify({
              departures: [
                {
                  tripId: "sbahn-1",
                  direction: "Wannsee",
                  line: { name: "S1", product: "suburban" },
                  when: new Date(Date.now() + 8 * 60_000).toISOString(),
                  plannedWhen: new Date(Date.now() + 8 * 60_000).toISOString(),
                  delay: null,
                },
              ],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        throw new Error(`Unexpected fetch: ${url}`);
      },
    );

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <TransportModule />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Bus" })).toBeDefined();
      expect(screen.getByRole("heading", { name: "S-Bahn" })).toBeDefined();
      expect(screen.getByText("M11")).toBeDefined();
      expect(screen.getByText("S1")).toBeDefined();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/locations/nearby"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/stops/bus-stop/departures"),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/stops/sbahn-stop/departures"),
    );
  });
});
