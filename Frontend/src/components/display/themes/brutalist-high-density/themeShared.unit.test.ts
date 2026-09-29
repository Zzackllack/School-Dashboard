import { describe, expect, it } from "vitest";
import { TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS } from "#/lib/transport";
import {
  buildDeparturesUrl,
  buildNearbyStopsUrl,
  filterDeparturesByProduct,
  resolveTransportStops,
} from "./themeShared";

describe("brutalist transport helpers", () => {
  it("uses a 60 second departures refresh interval", () => {
    expect(TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS).toBe(60_000);
  });

  it("keeps searching nearby stops until it finds the S-Bahn stop", () => {
    const stops = Array.from({ length: 25 }, (_, index) => ({
      id: `stop-${index}`,
      name: `Stop ${index}`,
      products: {
        bus: index === 0,
        suburban: index === 24,
      },
    }));

    const result = resolveTransportStops(stops);

    expect(result.busStop?.id).toBe("stop-0");
    expect(result.sBahnStop?.id).toBe("stop-24");
  });

  it("builds the proxied nearby stops request", () => {
    expect(buildNearbyStopsUrl(52.43, 13.3)).toBe(
      "/api/transport/stops/nearby?latitude=52.43&longitude=13.3&results=30",
    );
  });

  it("builds the proxied departures request", () => {
    expect(buildDeparturesUrl("sbahn-stop")).toContain(
      "/api/transport/stops/sbahn-stop/departures?",
    );
    expect(buildDeparturesUrl("sbahn-stop")).toContain("results=30");
    expect(buildDeparturesUrl("sbahn-stop")).toContain("duration=60");
  });

  it("filters departures by product because BVG ignores the suburban param", () => {
    // `S Lichterfelde West` serves both S1 and the M11, and the API returns both
    // regardless of `suburban=true`. Without this filter the S-Bahn section
    // renders bus lines with bus-coloured badges.
    const departure = (name: string, product: string) => ({
      tripId: `trip-${name}`,
      direction: "S Oranienburg",
      line: { name, product },
      when: "2026-09-29T14:47:00+02:00",
      plannedWhen: "2026-09-29T14:47:00+02:00",
      delay: null,
    });
    const departures = [departure("S1", "suburban"), departure("M11", "bus")];

    expect(
      filterDeparturesByProduct(departures, "suburban").map((d) => d.line.name),
    ).toEqual(["S1"]);
    expect(
      filterDeparturesByProduct(departures, "bus").map((d) => d.line.name),
    ).toEqual(["M11"]);
  });
});
