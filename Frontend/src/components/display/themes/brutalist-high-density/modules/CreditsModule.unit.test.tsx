// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CreditsModule } from "./CreditsModule";

describe("Brutalist credits module", () => {
  it("renders the Goethe logo image", () => {
    render(<CreditsModule />);

    expect(
      screen.getByAltText("Goethe Gymnasium Lichterfelde Logo"),
    ).toBeDefined();
  });
});
