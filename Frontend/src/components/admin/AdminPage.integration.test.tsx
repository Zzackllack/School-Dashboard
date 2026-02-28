// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { getRouter } from "../../router";

describe("AdminPage integration", () => {
  it("hydrates and renders correctly within router/app shell", async () => {
    window.history.pushState({}, "", "/admin");
    const router = getRouter();

    const { unmount } = render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Admin Route Placeholder" }),
      ).toBeDefined();
    });

    expect(screen.getByText(/Diese Route/i)).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();
    unmount();
  });
});
