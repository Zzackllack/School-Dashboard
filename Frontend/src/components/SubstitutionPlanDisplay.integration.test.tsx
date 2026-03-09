// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SubstitutionPlanDisplay from "./SubstitutionPlanDisplay";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });
}

describe("SubstitutionPlanDisplay", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides empty upstream entries and keeps meaningful substitutions", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            date: "9.3.2026 Montag",
            title: "Vertretungsplan",
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
                classes: "10b",
                comment: "Bitte Aufgaben in Moodle bearbeiten",
                date: "9.3.2026 Montag",
                newRoom: "",
                originalSubject: "Physik",
                period: "4",
                subject: "",
                substitute: "",
                type: "Entfall",
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

    render(
      <QueryClientProvider client={makeQueryClient()}>
        <SubstitutionPlanDisplay />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Bitte Aufgaben in Moodle bearbeiten"),
      ).toBeDefined();
    });

    expect(screen.queryByText("10d, 10a")).toBeNull();
    expect(screen.getAllByText("10b")).toHaveLength(2);
    expect(screen.getByText("Entfall")).toBeDefined();
  });
});
