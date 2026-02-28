// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminPage } from "./AdminPage";

describe("AdminPage", () => {
  it("renders heading, description, and semantic main landmark", () => {
    render(<AdminPage />);

    expect(
      screen.getByRole("heading", { name: "Admin Route Placeholder" }),
    ).toBeDefined();
    expect(screen.getByText(/Diese Route/i)).toBeDefined();
    expect(screen.getByRole("main")).toBeDefined();
  });
});
