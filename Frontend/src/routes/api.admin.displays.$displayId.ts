import { createFileRoute } from "@tanstack/react-router";
import {
  createProxyGetHandler,
  createProxyPatchHandler,
} from "../lib/proxy/proxy-get-handler";

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
    },
  },
});
