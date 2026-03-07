import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "../lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/auth/csrf")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/admin/auth/csrf", "admin-auth-csrf"),
    },
  },
});
