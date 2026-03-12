import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveDisplayAccess } from "../routes/display/$displayId";

vi.mock("../lib/display-session", () => ({
  clearDisplaySessionStorage: vi.fn(),
  getDisplayIdHint: vi.fn(),
  setDisplayIdHint: vi.fn(),
}));

vi.mock("../lib/api/displays", () => ({
  validateDisplaySession: vi.fn(),
}));

const displaySessionModule = await import("../lib/display-session");
const displaysApiModule = await import("../lib/api/displays");

describe("display route guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to setup when no display session token exists", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: false,
      displayId: null,
      displaySlug: null,
      assignedProfileId: null,
      themeId: null,
      redirectPath: null,
    });

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "redirect-setup",
    });
  });

  it("redirects to setup when session token is invalid", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: false,
      displayId: null,
      displaySlug: null,
      assignedProfileId: null,
      themeId: null,
      redirectPath: null,
    });

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "redirect-setup",
    });
    expect(displaySessionModule.clearDisplaySessionStorage).toHaveBeenCalled();
  });

  it("allows access when session token is valid for requested display", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: true,
      displayId: "display-1",
      displaySlug: "lobby",
      assignedProfileId: "default",
      themeId: "default",
      redirectPath: "/display/display-1",
    });

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "allow",
      displayId: "display-1",
      themeId: "default",
    });
    expect(displaySessionModule.setDisplayIdHint).toHaveBeenCalledWith(
      "display-1",
    );
  });

  it("redirects to assigned display when requested display id does not match", async () => {
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: true,
      displayId: "display-2",
      displaySlug: "hall",
      assignedProfileId: "default",
      themeId: "default",
      redirectPath: "/display/display-2",
    });

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "redirect-display",
      displayId: "display-2",
    });
    expect(displaySessionModule.setDisplayIdHint).toHaveBeenCalledWith(
      "display-2",
    );
  });

  it("keeps access when validation is temporarily unavailable but the display hint matches", async () => {
    vi.mocked(displaySessionModule.getDisplayIdHint).mockReturnValue(
      "display-1",
    );
    vi.mocked(displaysApiModule.validateDisplaySession).mockRejectedValue(
      new Error("network error"),
    );

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "allow",
      displayId: "display-1",
      themeId: null,
    });
    expect(
      displaySessionModule.clearDisplaySessionStorage,
    ).not.toHaveBeenCalled();
  });

  it("redirects to the hinted display when validation is temporarily unavailable", async () => {
    vi.mocked(displaySessionModule.getDisplayIdHint).mockReturnValue(
      "display-2",
    );
    vi.mocked(displaysApiModule.validateDisplaySession).mockRejectedValue(
      new Error("network error"),
    );

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "redirect-display",
      displayId: "display-2",
    });
  });

  it("propagates validation outages when no display hint exists", async () => {
    vi.mocked(displaySessionModule.getDisplayIdHint).mockReturnValue(null);
    vi.mocked(displaysApiModule.validateDisplaySession).mockRejectedValue(
      new Error("network error"),
    );

    await expect(resolveDisplayAccess("display-1")).rejects.toThrow(
      "Display session validation unavailable",
    );
  });
});
