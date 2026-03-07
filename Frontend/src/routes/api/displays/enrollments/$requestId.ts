import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/displays/enrollments/$requestId")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        createProxyGetHandler(
          `/displays/enrollments/${encodeURIComponent(params.requestId)}`,
          "display-enrollment-status",
        )({ request }),
    },
  },
});
