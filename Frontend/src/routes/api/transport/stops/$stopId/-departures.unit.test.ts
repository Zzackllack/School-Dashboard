import { afterEach, describe, expect, it, vi } from "vitest";
import { getTransportStopDeparturesGetHandler } from "#/test/helpers/getTransportStopDeparturesGetHandler";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("transport departures API route", () => {
  it("proxies stop departure responses from the BVG transport REST service", async () => {
    const handler = getTransportStopDeparturesGetHandler();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"departures":[]}', {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Upstream": "bvg-departures",
        },
      }),
    );

    const response = await handler({
      params: { stopId: "900000001" },
      request: new Request(
        "https://dashboard.local/api/transport/stops/900000001/departures?results=30&duration=60&suburban=true",
      ),
    });

    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "https://v6.bvg.transport.rest/stops/900000001/departures?results=30&duration=60&suburban=true",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-upstream")).toBe("bvg-departures");
    expect(await response.text()).toBe('{"departures":[]}');
  });
});
