// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrutalistHighDensityTheme } from "#/components/display/themes/brutalist-high-density/BrutalistHighDensityTheme";
import { DefaultDisplayTheme } from "#/components/display/themes/default/DefaultDisplayTheme";

vi.mock("#/components/display/useDisplayRuntime", () => ({
  useDisplayRuntime: () => ({
    isHydrated: true,
    currentTime: new Date("2026-03-07T12:30:00.000Z"),
  }),
}));

vi.mock("#/components/Clock", () => ({
  default: () => <div data-testid="module-clock">CLOCK</div>,
}));
vi.mock("#/components/SubstitutionPlanDisplay", () => ({
  default: () => <div data-testid="module-substitution">SUBSTITUTION</div>,
}));
vi.mock("#/components/Weather", () => ({
  default: () => <div data-testid="module-weather">WEATHER</div>,
}));
vi.mock("#/components/Transportation", () => ({
  default: () => <div data-testid="module-transport">TRANSPORT</div>,
}));
vi.mock("#/components/CalendarEvents", () => ({
  default: () => <div data-testid="module-calendar">CALENDAR</div>,
}));
vi.mock("#/components/Holidays", () => ({
  default: () => <div data-testid="module-holidays">HOLIDAYS</div>,
}));
vi.mock("#/components/Credits", () => ({
  default: () => <div data-testid="module-credits">CREDITS</div>,
}));

describe("display themes parity", () => {
  afterEach(() => {
    cleanup();
  });

  it("default theme renders all required modules", () => {
    render(<DefaultDisplayTheme displayId="display-1" />);

    expect(screen.getByTestId("module-substitution")).toBeDefined();
    expect(screen.getByTestId("module-weather")).toBeDefined();
    expect(screen.getByTestId("module-transport")).toBeDefined();
    expect(screen.getByTestId("module-calendar")).toBeDefined();
    expect(screen.getByTestId("module-holidays")).toBeDefined();
    expect(screen.getByTestId("module-clock")).toBeDefined();
  });

  it("brutalist theme renders all required modules", () => {
    render(<BrutalistHighDensityTheme displayId="display-1" />);

    expect(screen.getAllByTestId("module-substitution").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByTestId("module-weather").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("module-transport").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByTestId("module-calendar").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("module-holidays").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("module-clock").length).toBeGreaterThan(0);
    expect(screen.getByText(/Daily Bulletin \/\//)).toBeDefined();
  });
});
