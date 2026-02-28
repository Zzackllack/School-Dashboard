import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { loadDashboardRouteData } from "../routes/index";

const substitutionFixture = [
  {
    date: "01.01.2026 Mittwoch",
    title: "Vertretungsplan",
    entries: [],
    news: { date: "01.01.2026", newsItems: [] },
  },
];

const calendarFixture = [
  {
    summary: "Lehrerkonferenz",
    description: "Monatlicher Termin",
    location: "Aula",
    startDate: 1767225600000,
    endDate: 1767232800000,
    allDay: false,
  },
];

describe("dashboard route loader", () => {
  it("prefetches route-critical dashboard data", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        const url = typeof input === "string" ? input : input.toString();

        if (url.includes("/api/substitution/plans")) {
          return new Response(JSON.stringify(substitutionFixture), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.includes("/api/calendar/events?limit=5")) {
          return new Response(JSON.stringify(calendarFixture), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        throw new Error(`Unexpected request: ${url}`);
      });

    const queryClient = new QueryClient();

    await loadDashboardRouteData(queryClient);

    expect(queryClient.getQueryData(["substitution-plans"])).toEqual(
      substitutionFixture,
    );
    expect(queryClient.getQueryData(["calendar-events", 5])).toEqual(
      calendarFixture,
    );
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("does not throw when backend prefetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("ECONNREFUSED"));

    const queryClient = new QueryClient();

    await expect(loadDashboardRouteData(queryClient)).resolves.toBeUndefined();
  });
});
