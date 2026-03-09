// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DisplayPage } from "./DisplayPage";

const useParamsMock = vi.fn();
const resolveDisplayThemeMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useParams: () => useParamsMock(),
}));

vi.mock("#/components/display/themes/registry", () => ({
  resolveDisplayTheme: (...args: unknown[]) => resolveDisplayThemeMock(...args),
}));

describe("DisplayPage", () => {
  beforeEach(() => {
    useParamsMock.mockClear();
    resolveDisplayThemeMock.mockReset();
    resolveDisplayThemeMock.mockReturnValue({
      theme: {
        id: "default",
        Renderer: () => <div data-testid="dashboard-page">Dashboard</div>,
      },
      fallbackUsed: false,
      requestedThemeId: "default",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders dashboard content without the removed display overlay", () => {
    useParamsMock.mockReturnValue({ displayId: "display-42" });

    render(<DisplayPage themeId="default" />);

    expect(screen.getByTestId("dashboard-page")).toBeDefined();
    expect(screen.queryByText(/Display:/)).toBeNull();
  });

  it("renders gracefully when displayId is empty", () => {
    useParamsMock.mockReturnValue({ displayId: "" });

    render(<DisplayPage themeId={null} />);

    expect(screen.getByTestId("dashboard-page")).toBeDefined();
    expect(screen.queryByText(/Display:/)).toBeNull();
  });
});
