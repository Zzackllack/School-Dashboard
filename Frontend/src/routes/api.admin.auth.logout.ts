import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "../lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/auth/logout")({
  server: {
    handlers: {
      POST: createProxyPostHandler("/admin/auth/logout", "admin-auth-logout"),
    },
  },
});
