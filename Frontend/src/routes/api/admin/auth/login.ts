import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/auth/login")({
  server: {
    handlers: {
      POST: createProxyPostHandler("/admin/auth/login", "admin-auth-login"),
    },
  },
});
