import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveBootstrapRedirect } from "../routes/index";

vi.mock("../lib/display-session", () => ({
  clearDisplaySessionStorage: vi.fn(),
  setDisplayIdHint: vi.fn(),
}));

vi.mock("../lib/api/displays", () => ({
  validateDisplaySession: vi.fn(),
}));

const displaySessionModule = await import("../lib/display-session");
const displaysApiModule = await import("../lib/api/displays");

describe("bootstrap resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes to display when session validates", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: true,
      displayId: "display-1",
      displaySlug: "lobby",
      assignedProfileId: "default",
      redirectPath: "/display/display-1",
    });

    await expect(resolveBootstrapRedirect()).resolves.toEqual({
      to: "/display/$displayId",
      displayId: "display-1",
    });
    expect(displaySessionModule.setDisplayIdHint).toHaveBeenCalledWith(
      "display-1",
    );
  });

  it("routes to setup when session is invalid", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: false,
      displayId: null,
      displaySlug: null,
      assignedProfileId: null,
      redirectPath: null,
    });

    await expect(resolveBootstrapRedirect()).resolves.toEqual({ to: "/setup" });
    expect(displaySessionModule.clearDisplaySessionStorage).toHaveBeenCalled();
  });

  it("routes to setup when session validation fails", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockRejectedValue(
      new Error("network error"),
    );

    await expect(resolveBootstrapRedirect()).rejects.toThrow("network error");
    expect(
      displaySessionModule.clearDisplaySessionStorage,
    ).not.toHaveBeenCalled();
  });
});
