// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DisplayPage } from "./DisplayPage";

const useParamsMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useParams: () => useParamsMock(),
}));

describe("DisplayPage", () => {
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

    expect(
      screen.getAllByText(/Angefragte Display-ID:/i).length,
    ).toBeGreaterThan(0);
    const strongElements = document.querySelectorAll("strong");
    const lastStrong = strongElements.item(strongElements.length - 1);
    expect(lastStrong?.textContent ?? "").toBe("");
  });
});
