import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/surveys" as never)({
  server: {
    handlers: {
      GET: createProxyGetHandler("/admin/surveys", "admin-surveys"),
    },
  },
});
