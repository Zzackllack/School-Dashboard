import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calendarEventsQueryOptions,
  isMeaningfulSubstitutionEntry,
  sanitizeSubstitutionPlans,
  substitutionPlansQueryOptions,
} from "./dashboard";

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

describe("substitution plan sanitizing", () => {
  it("filters upstream placeholder entries that only contain class names", () => {
    expect(
      isMeaningfulSubstitutionEntry({
        absent: "",
        classes: "10d, 10a",
        comment: "",
        date: "9.3.2026 Montag",
        newRoom: "",
        originalSubject: "",
        period: "",
        subject: "",
        substitute: "",
        type: "",
      }),
    ).toBe(false);
  });

  it("keeps entries with visible substitution information", () => {
    expect(
      isMeaningfulSubstitutionEntry({
        absent: "",
        classes: "10a",
        comment: "",
        date: "9.3.2026 Montag",
        newRoom: "",
        originalSubject: "",
        period: "3",
        subject: "Mathe",
        substitute: "",
        type: "Entfall",
      }),
    ).toBe(true);
  });

  it("sanitizes substitution plans in the shared query function", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            date: "9.3.2026 Montag",
            title: "Plan",
            entries: [
              {
                absent: "",
                classes: "10d, 10a",
                comment: "",
                date: "9.3.2026 Montag",
                newRoom: "",
                originalSubject: "",
                period: "",
                subject: "",
                substitute: "",
                type: "",
              },
              {
                absent: "Müller",
                classes: "10a",
                comment: "",
                date: "9.3.2026 Montag",
                newRoom: "",
                originalSubject: "Mathe",
                period: "2",
                subject: "",
                substitute: "Schmidt",
                type: "Vertr.",
              },
            ],
            news: {
              date: "9.3.2026",
              newsItems: [],
            },
          },
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const queryClient = new QueryClient();
    const plans = await queryClient.fetchQuery(substitutionPlansQueryOptions);

    expect(fetchSpy).toHaveBeenCalledWith("/api/substitution/plans", undefined);
    expect(plans[0]?.entries).toHaveLength(1);
    expect(plans[0]?.entries[0]?.classes).toBe("10a");
    expect(
      sanitizeSubstitutionPlans([
        {
          date: "9.3.2026 Montag",
          title: "Plan",
          entries: plans[0]?.entries ?? [],
          news: {
            date: "9.3.2026",
            newsItems: [],
          },
        },
      ])[0]?.entries,
    ).toHaveLength(1);
  });
});
