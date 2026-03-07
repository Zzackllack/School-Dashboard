// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  DISPLAY_THEME_REGISTRY,
  resolveDisplayTheme,
} from "#/components/display/themes/registry";

describe("display theme registry", () => {
  it("resolves known theme ids", () => {
    const result = resolveDisplayTheme("brutalist-high-density");

    expect(result.fallbackUsed).toBe(false);
    expect(result.theme.id).toBe("brutalist-high-density");
  });

  it("falls back to default for unknown ids", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = resolveDisplayTheme("non-existent-theme");

    expect(result.fallbackUsed).toBe(true);
    expect(result.theme.id).toBe("default");
    expect(warnSpy).toHaveBeenCalledOnce();

    warnSpy.mockRestore();
  });

  it("keeps registry entries in sync with renderer map", () => {
    expect(DISPLAY_THEME_REGISTRY.length).toBeGreaterThanOrEqual(2);
    expect(
      DISPLAY_THEME_REGISTRY.every((theme) => typeof theme.Renderer === "function"),
    ).toBe(true);
  });
});
