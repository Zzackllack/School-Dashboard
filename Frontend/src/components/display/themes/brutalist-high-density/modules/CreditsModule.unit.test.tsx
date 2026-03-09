// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreditsModule } from "./CreditsModule";

describe("Brutalist credits module", () => {
  it("renders the credits image", () => {
    render(<CreditsModule />);

    expect(
      screen.getByAltText("Leistungs‑Kurs Exkursion Hamburg"),
    ).toBeDefined();
  });
});
