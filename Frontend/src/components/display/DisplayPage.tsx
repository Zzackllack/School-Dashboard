import { useParams } from "@tanstack/react-router";
import { resolveDisplayTheme } from "#/components/display/themes/registry";

interface DisplayPageProps {
  themeId: string | null;
}

export function DisplayPage({ themeId }: DisplayPageProps) {
  const { displayId } = useParams({ from: "/display/$displayId" });
  const resolvedTheme = resolveDisplayTheme(themeId);
  const ThemeRenderer = resolvedTheme.theme.Renderer;

  return (
    <main className="relative" data-display-theme={resolvedTheme.theme.id}>
      <header className="absolute left-4 top-4 z-20 rounded-md bg-slate-900/85 px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
        Display: {displayId}
      </header>
      <ThemeRenderer displayId={displayId} />
    </main>
  );
}
