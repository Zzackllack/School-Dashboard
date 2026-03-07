import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/displays/session")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/displays/session", "display-session"),
    },
  },
});
