// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { describe, expect, it, vi } from "vitest";
import { getRouter } from "../../router";

vi.mock("../../lib/query/dashboard", () => ({
  prefetchDashboardData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../DashboardPage", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

describe("DisplayPage integration", () => {
  it("renders route and resolves /display/:displayId params in app routing", async () => {
    window.history.pushState({}, "", "/display/test-screen");
    const router = getRouter();

    const { unmount } = render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(screen.getByText(/Display: test-screen/)).toBeDefined();
    });

    expect(screen.getByTestId("dashboard-page")).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();

    unmount();
  });
});
