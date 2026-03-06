import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getAdminAuthStatus } from "../lib/api/displays";

function AdminDisplaysLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/admin/displays")({
  beforeLoad: async () => {
    try {
      const authStatus = await getAdminAuthStatus();
      if (!authStatus.authenticated) {
        throw redirect({ to: "/admin/login" });
      }
    } catch {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminDisplaysLayout,
});
