import { describe, expect, it, vi } from "vitest";
import { resolveDisplayAccess } from "../routes/display.$displayId";

vi.mock("../lib/display-session", () => ({
  getDisplaySessionToken: vi.fn(),
  clearDisplaySessionStorage: vi.fn(),
  setDisplayIdHint: vi.fn(),
}));

vi.mock("../lib/api/displays", () => ({
  validateDisplaySession: vi.fn(),
}));

const displaySessionModule = await import("../lib/display-session");
const displaysApiModule = await import("../lib/api/displays");

describe("display route guard", () => {
  it("redirects to setup when no display session token exists", async () => {
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(null);

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "redirect-setup",
    });
  });

  it("redirects to setup when session token is invalid", async () => {
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(
      "revoked-token",
    );
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: false,
      displayId: null,
      displaySlug: null,
      assignedProfileId: null,
      redirectPath: null,
    });

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "redirect-setup",
    });
  });

  it("allows access when session token is valid for requested display", async () => {
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(
      "valid-token",
    );
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: true,
      displayId: "display-1",
      displaySlug: "lobby",
      assignedProfileId: "default",
      redirectPath: "/display/display-1",
    });

    await expect(resolveDisplayAccess("display-1")).resolves.toEqual({
      kind: "allow",
      displayId: "display-1",
    });
    expect(displaySessionModule.setDisplayIdHint).toHaveBeenCalledWith(
      "display-1",
    );
  });

  it("redirects to assigned display when requested display id does not match", async () => {
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(
      "valid-token",
    );
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: true,
      displayId: "display-2",
      displaySlug: "hall",
      assignedProfileId: "default",
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
});
