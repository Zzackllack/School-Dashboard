import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/auth/credentials")({
  server: {
    handlers: {
      POST: createProxyPostHandler(
        "/admin/auth/credentials",
        "admin-auth-credentials",
      ),
    },
  },
});
