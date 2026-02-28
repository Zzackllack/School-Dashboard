// @vitest-environment jsdom
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import DashboardPage from "../components/DashboardPage";

vi.mock("../components/CalendarEvents", () => ({
  default: () => <div>CalendarEvents</div>,
}));
vi.mock("../components/Credits", () => ({ default: () => <div>Credits</div> }));
vi.mock("../components/Holidays", () => ({
  default: () => <div>Holidays</div>,
}));
vi.mock("../components/SubstitutionPlanDisplay", () => ({
  default: () => <div>SubstitutionPlanDisplay</div>,
}));
vi.mock("../components/Transportation", () => ({
  default: () => <div>Transportation</div>,
}));
vi.mock("../components/Weather", () => ({ default: () => <div>Weather</div> }));
vi.mock("../hooks/useAutoScroll", () => ({ default: () => undefined }));

describe("DashboardPage hydration", () => {
  it("hydrates without mismatch and starts the client clock after mount", async () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const container = document.createElement("div");
    container.innerHTML = renderToString(<DashboardPage />);
    const root = hydrateRoot(container, <DashboardPage />);

    await act(async () => {});

    try {
      expect(
        container.querySelector('[data-testid="clock-placeholder"]'),
      ).not.toBeNull();
      expect(container.textContent).toContain("Stand: --");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });

      expect(
        container.querySelector('[data-testid="clock-time"]'),
      ).not.toBeNull();
      expect(container.textContent).not.toContain("Stand: --");

      const hydrationErrors = consoleErrorSpy.mock.calls.filter(([firstArg]) =>
        typeof firstArg === "string"
          ? firstArg.toLowerCase().includes("hydration")
          : false,
      );
      expect(hydrationErrors).toHaveLength(0);
    } finally {
      root.unmount();
      vi.useRealTimers();
    }
  });
});
