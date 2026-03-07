import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "../lib/proxy/proxy-get-handler";

export const Route = createFileRoute(
  "/api/admin/displays/enrollments/$requestId/reject",
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        createProxyPostHandler(
          `/admin/displays/enrollments/${encodeURIComponent(params.requestId)}/reject`,
          "admin-display-reject-enrollment",
        )({ request }),
    },
  },
});
