import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/warnings/current")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/warnings/current", "warnings"),
    },
  },
});
