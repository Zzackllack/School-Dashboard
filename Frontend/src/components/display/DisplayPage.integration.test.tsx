// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { getRouter } from "../../router";

vi.mock("../../lib/display-session", () => ({
  clearDisplaySessionStorage: vi.fn(),
  setDisplayIdHint: vi.fn(),
}));

vi.mock("../../lib/api/displays", () => ({
  validateDisplaySession: vi.fn().mockResolvedValue({
    valid: true,
    displayId: "test-screen",
    displaySlug: "test",
    assignedProfileId: "default",
    themeId: "default",
    redirectPath: "/display/test-screen",
  }),
}));

vi.mock("#/components/display/themes/registry", () => ({
  resolveDisplayTheme: vi.fn().mockReturnValue({
    theme: {
      id: "default",
      Renderer: () => <div data-testid="dashboard-page">Dashboard</div>,
    },
    fallbackUsed: false,
    requestedThemeId: "default",
  }),
}));

describe("DisplayPage integration", () => {
  it("renders route and resolves /display/:displayId params in app routing", async () => {
    window.history.pushState({}, "", "/display/test-screen");
    const router = getRouter();

    const { unmount } = render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-page")).toBeDefined();
    });

    expect(screen.getByRole("main")).toBeDefined();

    unmount();
  });
});
