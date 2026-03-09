// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SurveyQrModule } from "./SurveyQrModule";

describe("SurveyQrModule", () => {
  it("renders german copy and display-specific target url", () => {
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      origin: "https://dashboard.example",
    });

    render(<SurveyQrModule displayId="display-123" />);

    expect(screen.getByText("Dein Feedback")).toBeDefined();
    expect(
      screen.getByText(
        "Scanne den QR-Code und sende uns Probleme, Wuensche oder allgemeines Feedback direkt zu diesem Display.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText("https://dashboard.example/rueckmeldung/display-123"),
    ).toBeDefined();
    expect(
      screen.getByTitle("QR-Code fuer Rueckmeldung zu Display display-123"),
    ).toBeDefined();
  });
});
