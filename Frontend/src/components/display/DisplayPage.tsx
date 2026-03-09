import { useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { resolveDisplayTheme } from "#/components/display/themes/registry";

interface DisplayPageProps {
  themeId: string | null;
}

export function DisplayPage({ themeId }: DisplayPageProps) {
  const { displayId } = useParams({ from: "/display/$displayId" });
  const resolvedTheme = useMemo(() => resolveDisplayTheme(themeId), [themeId]);
  const ThemeRenderer = resolvedTheme.theme.Renderer;

  return (
    <main className="relative" data-display-theme={resolvedTheme.theme.id}>
      <ThemeRenderer displayId={displayId} />
    </main>
  );
}
