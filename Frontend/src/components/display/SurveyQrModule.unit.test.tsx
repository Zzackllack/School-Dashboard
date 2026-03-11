// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SurveyQrModule } from "./SurveyQrModule";

describe("SurveyQrModule", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders german copy and display-specific target url", () => {
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      origin: "https://dashboard.example",
    });

    render(<SurveyQrModule displayId="display-123" />);

    expect(screen.getByText("Dein Feedback")).toBeDefined();
    expect(
      screen.getByText(
        "Scanne den QR-Code und sende uns Probleme, Wünsche oder allgemeines Feedback direkt zu diesem Display.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText("https://dashboard.example/rueckmeldung/display-123"),
    ).toBeDefined();
    expect(
      screen.getByTitle("QR-Code für Rückmeldung zu Display display-123"),
    ).toBeDefined();
  });

  it("uses the simplified brutalist layout without fallback url copy", () => {
    const { container } = render(
      <SurveyQrModule displayId="display-123" variant="brutalist" />,
    );
    const module = within(container);

    expect(module.getByText("Feedback")).toBeDefined();
    expect(
      module.queryByText("Falls das Scannen nicht klappt, öffne:"),
    ).toBeNull();
    expect(
      module.queryByText(/rueckmeldung\/display-123$/),
    ).toBeNull();
  });
});
