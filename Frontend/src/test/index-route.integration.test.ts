import { describe, expect, it, vi } from "vitest";
import { resolveBootstrapRedirect } from "../routes/index";

vi.mock("../lib/display-session", () => ({
  getDisplaySessionToken: vi.fn(),
  setDisplayIdHint: vi.fn(),
}));

vi.mock("../lib/api/displays", () => ({
  validateDisplaySession: vi.fn(),
}));

const displaySessionModule = await import("../lib/display-session");
const displaysApiModule = await import("../lib/api/displays");

describe("bootstrap resolver", () => {
  it("routes to setup when no token is present", async () => {
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(null);

    await expect(resolveBootstrapRedirect()).resolves.toEqual({ to: "/setup" });
  });

  it("routes to display when session validates", async () => {
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(
      "session-token",
    );
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
    vi.mocked(displaySessionModule.getDisplaySessionToken).mockReturnValue(
      "session-token",
    );
    vi.mocked(displaysApiModule.validateDisplaySession).mockResolvedValue({
      valid: false,
      displayId: null,
      displaySlug: null,
      assignedProfileId: null,
      redirectPath: null,
    });

    await expect(resolveBootstrapRedirect()).resolves.toEqual({ to: "/setup" });
  });
});
