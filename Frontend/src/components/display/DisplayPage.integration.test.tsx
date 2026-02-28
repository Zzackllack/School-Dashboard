// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { RouterProvider } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { getRouter } from "../../router";

describe("DisplayPage integration", () => {
  it("renders route and resolves /display/:screenId params in app routing", async () => {
    window.history.pushState({}, "", "/display/test-screen");
    const router = getRouter();

    const { unmount } = render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Display Route Placeholder" }),
      ).toBeDefined();
    });

    expect(screen.getByText(/Angefragte Display-ID:/i)).toBeDefined();
    expect(screen.getByText("test-screen")).toBeDefined();
    expect(document.querySelector("main.min-h-screen")).not.toBeNull();

    unmount();
  });

  it("initializes router state/context when DisplayPage is rendered", async () => {
    window.history.pushState({}, "", "/display/stateful-screen");
    const router = getRouter();

    const { unmount } = render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/display/stateful-screen");
    });

    expect(router.options.context.queryClient).toBeDefined();
    expect(
      router.state.matches.some((match) =>
        String(match.routeId).includes("/display/$screenId"),
      ),
    ).toBe(true);

    unmount();
  });
});
