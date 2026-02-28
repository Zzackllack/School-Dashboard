import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarEventsQueryOptions } from "./dashboard";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calendarEventsQueryOptions", () => {
  it.each([
    { limit: Number.NaN, expected: 5 },
    { limit: 0, expected: 5 },
    { limit: -4, expected: 5 },
    { limit: 3.8, expected: 3 },
    { limit: 99, expected: 50 },
  ])(
    "normalizes limit $limit to $expected for query key and request URL",
    async ({ limit, expected }) => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("[]", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const queryOptions = calendarEventsQueryOptions(limit);
      const queryClient = new QueryClient();

      expect(queryOptions.queryKey).toEqual(["calendar-events", expected]);

      await queryClient.fetchQuery(queryOptions);
      expect(fetchSpy).toHaveBeenCalledWith(
        `/api/calendar/events?limit=${expected}`,
        undefined,
      );
    },
  );
});
