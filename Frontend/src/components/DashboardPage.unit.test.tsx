// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage";

vi.mock("./CalendarEvents", () => ({
  default: () => <div>CalendarEvents</div>,
}));
vi.mock("./Credits", () => ({ default: () => <div>Credits</div> }));
vi.mock("./Holidays", () => ({ default: () => <div>Holidays</div> }));
vi.mock("./SubstitutionPlanDisplay", () => ({
  default: () => <div>SubstitutionPlanDisplay</div>,
}));
vi.mock("./Transportation", () => ({
  default: () => <div>Transportation</div>,
}));
vi.mock("./Weather", () => ({ default: () => <div>Weather</div> }));
vi.mock("./display/useDisplayRuntime", () => ({
  useDisplayRuntime: () => ({
    isHydrated: false,
    currentTime: null,
  }),
}));

describe("DashboardPage", () => {
  it("renders a non-time placeholder before the client clock is ready", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("clock-placeholder")).toBeDefined();
    expect(screen.getByText("Stand: --")).toBeDefined();
    expect(screen.queryByTestId("clock-time")).toBeNull();
  });
});
