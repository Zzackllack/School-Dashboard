import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "../lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/auth/me")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/admin/auth/me", "admin-auth-me"),
    },
  },
});
