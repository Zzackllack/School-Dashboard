import { describe, expect, it } from "vitest";
import { Route } from "./route";

describe("admin route", () => {
  it("renders a shell component for nested admin routes", () => {
    expect(Route.options.component).toBeTypeOf("function");
  });
});
