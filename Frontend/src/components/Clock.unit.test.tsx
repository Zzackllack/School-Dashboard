// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Clock from "./Clock";

describe("Clock", () => {
  it("renders German date and 24-hour time format", () => {
    const fixedDate = new Date("2026-03-07T17:04:05.000Z");
    render(<Clock currentTime={fixedDate} />);

    expect(screen.getByTestId("clock-time").textContent).toMatch(
      /^\d{2}:\d{2}:\d{2}$/,
    );
    expect(screen.getByTestId("clock-time").textContent).not.toContain("AM");
    expect(screen.getByTestId("clock-time").textContent).not.toContain("PM");
    expect(screen.getByTestId("clock-date").textContent).toMatch(
      /^\d{2}\.\d{2}\.\d{4}$/,
    );
  });
});
