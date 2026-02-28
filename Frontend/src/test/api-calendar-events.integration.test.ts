import { describe, expect, it, vi } from "vitest";
import { Route } from "../routes/api.calendar.events";

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

describe("calendar events API route timeout handling", () => {
  it("aborts slow upstream requests and returns 504 Gateway Timeout", async () => {
    vi.useFakeTimers();
    const handler = getCalendarEventsGetHandler();
    try {
      vi.spyOn(globalThis, "fetch").mockImplementation(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            const signal = init?.signal;
            if (!signal) {
              return;
            }

            signal.addEventListener(
              "abort",
              () => {
                reject(new DOMException("aborted", "AbortError"));
              },
              { once: true },
            );
          }),
      );

      const responsePromise = handler({
        request: new Request(
          "https://dashboard.local/api/calendar/events?limit=5",
        ),
      });

      await vi.advanceTimersByTimeAsync(8_000);
      const response = await responsePromise;

      expect(response.status).toBe(504);
      expect(response.statusText).toBe("Gateway Timeout");
      await expect(response.json()).resolves.toEqual({
        message: "Backend timeout",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
