import { afterEach, describe, expect, it, vi } from "vitest";
import { getTransportNearbyStopsGetHandler } from "#/test/helpers/getTransportNearbyStopsGetHandler";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("transport nearby stops API route", () => {
  it("proxies nearby stop responses from the BVG transport REST service", async () => {
    const handler = getTransportNearbyStopsGetHandler();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('[{"id":"9001"}]', {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Encoding": "br",
          "Content-Length": "999",
          "X-Upstream": "bvg-nearby",
        },
      }),
    );

    const response = await handler({
      request: new Request(
        "https://dashboard.local/api/transport/stops/nearby?latitude=52.43&longitude=13.30&results=30",
      ),
    });

    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "https://v6.bvg.transport.rest/locations/nearby?latitude=52.43&longitude=13.30&results=30",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("x-upstream")).toBe("bvg-nearby");
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("content-length")).toBeNull();
    expect(await response.text()).toBe('[{"id":"9001"}]');
  });

  it("returns a JSON 503 response when the upstream fetch fails", async () => {
    const handler = getTransportNearbyStopsGetHandler();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNRESET"));

    const response = await handler({
      request: new Request(
        "https://dashboard.local/api/transport/stops/nearby?latitude=52.43&longitude=13.30&results=30",
      ),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "Transport API unavailable",
    });
  });
});
