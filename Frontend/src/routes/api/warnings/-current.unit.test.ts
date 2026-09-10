import { afterEach, describe, expect, it, vi } from "vitest";
import { Route } from "./current";

const originalBackendUrl = process.env.BACKEND_URL;

afterEach(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
});

describe("current warnings API route", () => {
  it("forwards the backend warning snapshot", async () => {
    process.env.BACKEND_URL = "http://backend:8080";
    const handlers = (Route.options.server as { handlers?: unknown })
      .handlers as {
      GET: (ctx: { request: Request }) => Promise<Response>;
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"warnings":[]}', {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await handlers.GET({
      request: new Request("https://dashboard.local/api/warnings/current"),
    });

    expect(String(fetchSpy.mock.calls[0]?.[0])).toBe(
      "http://backend:8080/api/warnings/current",
    );
    expect(
      (fetchSpy.mock.calls[0]?.[1] as RequestInit | undefined)?.method,
    ).toBe("GET");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ warnings: [] });
  });
});
