// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarModule, getUpcomingCalendarEvents } from "./CalendarModule";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

describe("Brutalist calendar module", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the next ongoing or upcoming events and drops finished ones", () => {
    const now = new Date("2026-03-12T09:00:00.000Z");

    expect(
      getUpcomingCalendarEvents(
        [
          {
            summary: "Running now",
            description: "",
            location: "",
            startDate: Date.parse("2026-03-11T08:00:00.000Z"),
            endDate: Date.parse("2026-03-12T12:00:00.000Z"),
            allDay: false,
          },
          {
            summary: "Upcoming later",
            description: "",
            location: "",
            startDate: Date.parse("2026-03-20T10:00:00.000Z"),
            endDate: Date.parse("2026-03-20T11:00:00.000Z"),
            allDay: false,
          },
          {
            summary: "Upcoming sooner",
            description: "",
            location: "",
            startDate: Date.parse("2026-03-13T10:00:00.000Z"),
            endDate: Date.parse("2026-03-13T11:00:00.000Z"),
            allDay: false,
          },
          {
            summary: "Already over",
            description: "",
            location: "",
            startDate: Date.parse("2026-03-10T10:00:00.000Z"),
            endDate: Date.parse("2026-03-11T11:00:00.000Z"),
            allDay: false,
          },
        ],
        now,
      ).map((event) => event.summary),
    ).toEqual(["Running now", "Upcoming sooner", "Upcoming later"]);
  });

  it("renders at most the next three visible events", async () => {
    const now = Date.now();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            summary: "Event 1",
            description: "",
            location: "",
            startDate: now + 60 * 60 * 1_000,
            endDate: now + 2 * 60 * 60 * 1_000,
            allDay: false,
          },
          {
            summary: "Event 2",
            description: "",
            location: "",
            startDate: now + 24 * 60 * 60 * 1_000,
            endDate: now + 25 * 60 * 60 * 1_000,
            allDay: false,
          },
          {
            summary: "Event 3",
            description: "",
            location: "",
            startDate: now + 2 * 24 * 60 * 60 * 1_000,
            endDate: now + (2 * 24 + 1) * 60 * 60 * 1_000,
            allDay: false,
          },
          {
            summary: "Event 4",
            description: "",
            location: "",
            startDate: now + 4 * 24 * 60 * 60 * 1_000,
            endDate: now + (4 * 24 + 1) * 60 * 60 * 1_000,
            allDay: false,
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <CalendarModule />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Event 1")).toBeDefined();
    expect(screen.getByText("Event 2")).toBeDefined();
    expect(screen.getByText("Event 3")).toBeDefined();
    expect(screen.queryByText("Event 4")).toBeNull();
  });
});
