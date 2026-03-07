import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/displays/audit-logs")({
  server: {
    handlers: {
      GET: createProxyGetHandler(
        "/admin/displays/audit-logs",
        "admin-audit-logs",
      ),
    },
  },
});
