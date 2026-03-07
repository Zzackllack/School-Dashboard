import { beforeEach, describe, expect, it, vi } from "vitest";
import * as displaysApi from "#/lib/api/displays";
import { Route } from "./route";

describe("admin displays route guard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips auth fetch during server-side preloading", async () => {
    const authSpy = vi.spyOn(displaysApi, "getAdminAuthStatus");

    await expect(Route.options.beforeLoad?.({} as never)).resolves.toBe(
      undefined,
    );
    expect(authSpy).not.toHaveBeenCalled();
  });

  it("redirects to login when unauthenticated in browser", async () => {
    const originalWindow = globalThis.window;
    vi.spyOn(displaysApi, "getAdminAuthStatus").mockResolvedValue({
      authenticated: false,
      username: null,
      roles: [],
    });
    try {
      Object.defineProperty(globalThis, "window", {
        value: {} as Window & typeof globalThis,
        configurable: true,
      });

      await expect(
        Route.options.beforeLoad?.({} as never),
      ).rejects.toMatchObject({
        options: { to: "/admin/login" },
      });
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
      });
    }
  });
});
