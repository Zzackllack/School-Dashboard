export const DEFAULT_DISPLAY_THEME_ID = "default";

export interface DisplayThemeCatalogEntry {
  id: string;
  label: string;
  description: string;
}

export const DISPLAY_THEME_CATALOG: DisplayThemeCatalogEntry[] = [
  {
    id: DEFAULT_DISPLAY_THEME_ID,
    label: "Default",
    description: "Current balanced dashboard layout",
  },
  {
    id: "brutalist-high-density",
    label: "Brutalist High Density",
    description: "High-contrast 70/30 layout inspired by display spec examples",
  },
];
