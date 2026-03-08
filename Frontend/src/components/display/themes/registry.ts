import type { ComponentType } from "react";
import { BrutalistHighDensityTheme } from "#/components/display/themes/brutalist-high-density/BrutalistHighDensityTheme";
import {
  DEFAULT_DISPLAY_THEME_ID,
  DISPLAY_THEME_CATALOG,
} from "#/components/display/themes/catalog";
import { DefaultDisplayTheme } from "#/components/display/themes/default/DefaultDisplayTheme";
import type { DisplayThemeProps } from "#/components/display/themes/types";

export interface DisplayThemeDefinition {
  id: string;
  label: string;
  description: string;
  Renderer: ComponentType<DisplayThemeProps>;
}

const DISPLAY_THEME_RENDERERS: Record<
  string,
  ComponentType<DisplayThemeProps>
> = {
  [DEFAULT_DISPLAY_THEME_ID]: DefaultDisplayTheme,
  "brutalist-high-density": BrutalistHighDensityTheme,
};

export const DISPLAY_THEME_REGISTRY: DisplayThemeDefinition[] =
  DISPLAY_THEME_CATALOG.map((theme) => ({
    ...theme,
    Renderer: DISPLAY_THEME_RENDERERS[theme.id] ?? DefaultDisplayTheme,
  }));

const DISPLAY_THEME_REGISTRY_MAP = new Map(
  DISPLAY_THEME_REGISTRY.map((theme) => [theme.id, theme]),
);

export function resolveDisplayTheme(themeId: string | null | undefined) {
  const normalizedThemeId = themeId?.trim() || DEFAULT_DISPLAY_THEME_ID;
  const resolvedTheme = DISPLAY_THEME_REGISTRY_MAP.get(normalizedThemeId);

  if (resolvedTheme) {
    return {
      theme: resolvedTheme,
      fallbackUsed: false,
      requestedThemeId: normalizedThemeId,
    };
  }

  console.warn(
    `Unknown display theme id '${normalizedThemeId}', falling back to '${DEFAULT_DISPLAY_THEME_ID}'.`,
  );

  const defaultTheme = DISPLAY_THEME_REGISTRY_MAP.get(DEFAULT_DISPLAY_THEME_ID);
  if (!defaultTheme) {
    throw new Error(
      `Default display theme '${DEFAULT_DISPLAY_THEME_ID}' is not registered.`,
    );
  }

  return {
    theme: defaultTheme,
    fallbackUsed: true,
    requestedThemeId: normalizedThemeId,
  };
}
