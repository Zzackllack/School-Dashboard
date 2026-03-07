import { createFileRoute } from "@tanstack/react-router";
import {
  createProxyDeleteHandler,
  createProxyGetHandler,
  createProxyPatchHandler,
} from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/displays/$displayId")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        createProxyGetHandler(
          `/admin/displays/${encodeURIComponent(params.displayId)}`,
          "admin-display-detail",
        )({ request }),
      PATCH: ({ request, params }) =>
        createProxyPatchHandler(
          `/admin/displays/${encodeURIComponent(params.displayId)}`,
          "admin-display-update",
        )({ request }),
      DELETE: ({ request, params }) =>
        createProxyDeleteHandler(
          `/admin/displays/${encodeURIComponent(params.displayId)}`,
          "admin-display-delete",
        )({ request }),
    },
  },
});
