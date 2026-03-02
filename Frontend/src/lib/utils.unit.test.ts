import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("concatenates conditional class names", () => {
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });

  it("resolves conflicting Tailwind classes to the last one", () => {
    expect(cn("p-2", "p-4", "bg-red-500", "bg-blue-500")).toBe(
      "p-4 bg-blue-500",
    );
  });
});
