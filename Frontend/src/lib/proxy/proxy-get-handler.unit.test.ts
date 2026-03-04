import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createProxyPatchHandler,
  createProxyPostHandler,
} from "./proxy-get-handler";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("proxy request handlers", () => {
  it("forwards POST bodies, cookie and csrf header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const handler = createProxyPostHandler(
      "/admin/displays/enrollment-codes",
      "admin-codes",
    );

    await handler({
      request: new Request(
        "https://dashboard.local/api/admin/displays/enrollment-codes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: "JSESSIONID=session-1; XSRF-TOKEN=csrf-cookie",
            "X-CSRF-TOKEN": "csrf-header",
          },
          body: JSON.stringify({ ttlSeconds: 300, maxUses: 2 }),
        },
      ),
    });

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect((init as RequestInit | undefined)?.method).toBe("POST");
    expect(headers.get("cookie")).toContain("JSESSIONID=session-1");
    expect(headers.get("x-csrf-token")).toBe("csrf-header");
    await expect(
      new Response((init as RequestInit | undefined)?.body).text(),
    ).resolves.toContain("ttlSeconds");
  });

  it("forwards PATCH bodies", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "display-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const handler = createProxyPatchHandler(
      "/admin/displays/display-1",
      "display-update",
    );

    await handler({
      request: new Request(
        "https://dashboard.local/api/admin/displays/display-1",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "INACTIVE" }),
        },
      ),
    });

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect((init as RequestInit | undefined)?.method).toBe("PATCH");
    await expect(
      new Response((init as RequestInit | undefined)?.body).text(),
    ).resolves.toContain("INACTIVE");
  });
});
