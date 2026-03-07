import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/displays")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/admin/displays", "admin-displays"),
    },
  },
});
