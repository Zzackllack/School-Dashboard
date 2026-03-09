import DashboardPage from "#/components/DashboardPage";
import type { DisplayThemeProps } from "#/components/display/themes/types";

export function DefaultDisplayTheme({
  displayId,
}: DisplayThemeProps) {
  return <DashboardPage displayId={displayId} />;
}
