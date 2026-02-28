// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DisplayPage } from "./DisplayPage";

const useParamsMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useParams: () => useParamsMock(),
}));

describe("DisplayPage", () => {
  beforeEach(() => {
    useParamsMock.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders screen id from useParams and scaffold text", () => {
    useParamsMock.mockReturnValue({ screenId: "screen-42" });

    render(<DisplayPage />);

    expect(
      screen.getByRole("heading", { name: "Display Route Placeholder" }),
    ).toBeDefined();
    expect(
      screen.getByText(/display-spezifische Konfigurationen/i),
    ).toBeDefined();
    expect(screen.getByText(/Angefragte Display-ID:/i)).toBeDefined();
    expect(screen.getByText("screen-42")).toBeDefined();
  });

  it("renders gracefully when screenId is missing", () => {
    useParamsMock.mockReturnValue({ screenId: "" });

    render(<DisplayPage />);

    const idLabel = screen.getByText(/Angefragte Display-ID:/i);
    expect(idLabel).toBeDefined();
    expect(idLabel.textContent ?? "").toContain("Angefragte Display-ID:");
  });
});
