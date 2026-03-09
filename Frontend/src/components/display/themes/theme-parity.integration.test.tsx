// @vitest-environment jsdom
import { BrutalistHighDensityTheme } from "#/components/display/themes/brutalist-high-density/BrutalistHighDensityTheme";
import { DefaultDisplayTheme } from "#/components/display/themes/default/DefaultDisplayTheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("#/components/display/useDisplayRuntime", () => ({
  useDisplayRuntime: () => ({
    isHydrated: true,
    currentTime: new Date("2026-03-07T12:30:00.000Z"),
  }),
}));

vi.mock("#/components/Clock", () => ({
  default: () => <div data-testid="mock-clock">CLOCK</div>,
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
vi.mock("#/components/display/SurveyQrModule", () => ({
  SurveyQrModule: () => <div data-testid="module-survey">SURVEY</div>,
}));

/** QueryClient with all fetching disabled so no real network requests are made. */
function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { enabled: false, retry: false, gcTime: 0 },
    },
  });
}

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
    expect(screen.getByTestId("module-survey")).toBeDefined();
  });

  it("brutalist theme renders all required modules", () => {
    render(
      <QueryClientProvider client={makeTestQueryClient()}>
        <BrutalistHighDensityTheme displayId="display-1" />
      </QueryClientProvider>,
    );

    // Grade column headers (em-dash separators matching the design)
    expect(screen.getByText("07—08")).toBeDefined();
    expect(screen.getByText("09—10")).toBeDefined();
    expect(screen.getByText("11—12")).toBeDefined();

    // Right-sidebar module containers
    expect(screen.getByTestId("module-weather")).toBeDefined();
    expect(screen.getByTestId("module-transport")).toBeDefined();
    expect(screen.getByTestId("module-calendar")).toBeDefined();
    expect(screen.getByTestId("module-holidays")).toBeDefined();
    expect(screen.getByTestId("module-survey")).toBeDefined();
    expect(screen.getByTestId("module-credits")).toBeDefined();

    // Clock wrapper is always present
    expect(screen.getByTestId("module-clock")).toBeDefined();
  });
});
