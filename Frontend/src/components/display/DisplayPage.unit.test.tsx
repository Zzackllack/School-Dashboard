// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DisplayPage } from "./DisplayPage";

const useParamsMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useParams: () => useParamsMock(),
}));

vi.mock("../DashboardPage", () => ({
  default: () => <div data-testid="dashboard-page">Dashboard</div>,
}));

describe("DisplayPage", () => {
  beforeEach(() => {
    useParamsMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders display id header and dashboard content", () => {
    useParamsMock.mockReturnValue({ displayId: "display-42" });

    render(<DisplayPage />);

    expect(screen.getByText(/Display: display-42/)).toBeDefined();
    expect(screen.getByTestId("dashboard-page")).toBeDefined();
  });

  it("renders gracefully when displayId is empty", () => {
    useParamsMock.mockReturnValue({ displayId: "" });

    render(<DisplayPage />);

    expect(screen.getByText(/Display:/)).toBeDefined();
  });
});
