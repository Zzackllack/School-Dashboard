import DashboardPage from "#/components/DashboardPage";
import type { DisplayThemeProps } from "#/components/display/themes/types";

export function DefaultDisplayTheme({ displayId: _displayId }: DisplayThemeProps) {
  void _displayId;
  return <DashboardPage />;
}
