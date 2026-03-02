import { Outlet, createFileRoute } from "@tanstack/react-router";

function AdminRouteShell() {
  return <Outlet />;
}

export const Route = createFileRoute("/admin")({
  component: AdminRouteShell,
});
