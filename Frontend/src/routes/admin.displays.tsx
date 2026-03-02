import { Outlet, createFileRoute } from "@tanstack/react-router";

function AdminDisplaysLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/admin/displays")({
  component: AdminDisplaysLayout,
});
