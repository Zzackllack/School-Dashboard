import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/substitution/plans")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/substitution/plans", "substitution"),
    },
  },
});
