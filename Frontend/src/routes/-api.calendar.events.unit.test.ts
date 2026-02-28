import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./api.calendar.events";

const originalBackendUrl = process.env.BACKEND_URL;

function getCalendarEventsGetHandler() {
  const handlers = (Route.options.server as { handlers?: unknown } | undefined)
    ?.handlers;
  if (!handlers) {
    throw new Error("Route server handlers are not configured");
  }

  const resolvedHandlers =
    typeof handlers === "function" ? handlers({} as never) : handlers;
  return (
    resolvedHandlers as {
      GET: (ctx: { request: Request }) => Promise<Response>;
    }
  ).GET;
}

afterEach(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
});

describe("calendar events API route", () => {
  it("forwards status, statusText, headers, and body from the upstream response", async () => {
    process.env.BACKEND_URL = "http://backend:8080";
    const handler = getCalendarEventsGetHandler();

    const upstreamResponse = new Response("upstream-stream", {
      status: 206,
      statusText: "Partial Content",
      headers: {
        "Content-Type": "application/json",
        "X-Upstream": "calendar",
      },
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(upstreamResponse);

    const response = await handler({
      request: new Request(
        "https://dashboard.local/api/calendar/events?limit=12",
      ),
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "http://backend:8080/api/calendar/events?limit=12",
    );
    expect(response.status).toBe(206);
    expect(response.statusText).toBe("Partial Content");
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("x-upstream")).toBe("calendar");
    expect(await response.text()).toBe("upstream-stream");
  });

  it("returns a JSON 503 Service Unavailable response when upstream fetch fails", async () => {
    const handler = getCalendarEventsGetHandler();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const response = await handler({
      request: new Request(
        "https://dashboard.local/api/calendar/events?limit=5",
      ),
    });

    expect(response.status).toBe(503);
    expect(response.statusText).toBe("Service Unavailable");
    await expect(response.json()).resolves.toEqual({
      message: "Backend unavailable",
    });
  });
});
