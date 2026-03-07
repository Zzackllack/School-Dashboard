import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute(
  "/api/admin/displays/$displayId/revoke-session",
)({
  server: {
    handlers: {
      POST: ({ request, params }) =>
        createProxyPostHandler(
          `/admin/displays/${encodeURIComponent(params.displayId)}/revoke-session`,
          "admin-display-revoke-session",
        )({ request }),
    },
  },
});
