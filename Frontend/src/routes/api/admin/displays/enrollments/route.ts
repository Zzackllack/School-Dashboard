import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/displays/enrollments")({
  server: {
    handlers: {
      GET: createProxyGetHandler(
        "/admin/displays/enrollments",
        "admin-display-enrollments",
      ),
    },
  },
});
