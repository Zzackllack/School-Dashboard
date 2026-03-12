import { describe, expect, it } from "vitest";
import { TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS } from "#/lib/transport";
import { buildDeparturesUrl, resolveTransportStops } from "./themeShared";

describe("brutalist transport helpers", () => {
  it("uses a 30 second departures refresh interval", () => {
    expect(TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS).toBe(30_000);
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

  it("builds the S-Bahn departures request like the default theme", () => {
    expect(buildDeparturesUrl("sbahn-stop")).toContain("results=30");
    expect(buildDeparturesUrl("sbahn-stop")).toContain("duration=60");
    expect(buildDeparturesUrl("sbahn-stop", { suburbanOnly: true })).toContain(
      "suburban=true",
    );
  });
});
