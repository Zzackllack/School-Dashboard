import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/calendar/events")({
  server: {
    handlers: {
      GET: createProxyGetHandler("/calendar/events", "calendar"),
    },
  },
});
