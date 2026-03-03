import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "../lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/displays/auth/verify")({
  server: {
    handlers: {
      POST: createProxyPostHandler(
        "/admin/displays/auth/verify",
        "admin-auth-verify",
      ),
    },
  },
});
