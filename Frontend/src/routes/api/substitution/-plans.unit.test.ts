import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./api.substitution.plans";

function getSubstitutionPlansGetHandler() {
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
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("substitution plans API route", () => {
  it("aborts slow upstream requests and returns 504 Gateway Timeout", async () => {
    vi.useFakeTimers();
    const handler = getSubstitutionPlansGetHandler();

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
        "https://dashboard.local/api/substitution/plans?screen=lobby",
      ),
    });

    await vi.advanceTimersByTimeAsync(8_000);
    const response = await responsePromise;

    expect(response.status).toBe(504);
    expect(response.statusText).toBe("Gateway Timeout");
    await expect(response.json()).resolves.toEqual({
      message: "Backend timeout",
    });
  });

  it("returns 503 when upstream fetch rejects with non-abort errors", async () => {
    const handler = getSubstitutionPlansGetHandler();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const response = await handler({
      request: new Request("https://dashboard.local/api/substitution/plans"),
    });

    expect(response.status).toBe(503);
    expect(response.statusText).toBe("Service Unavailable");
    await expect(response.json()).resolves.toEqual({
      message: "Backend unavailable",
    });
  });
});
