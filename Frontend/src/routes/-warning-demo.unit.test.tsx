// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it } from "vitest";
import { WarningDemoPage } from "./warning-demo";

afterEach(() => {
  cleanup();
});

describe("WarningDemoPage", () => {
  it("renders the production warning overlay with demo data", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <WarningDemoPage />
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("warning-overlay")).toBeDefined();
    expect(
      screen.getByText("Starke Rauchentwicklung im Bereich Lichterfelde"),
    ).toBeDefined();
    expect(screen.getByText("Warnungsdemo")).toBeDefined();
  });
});
