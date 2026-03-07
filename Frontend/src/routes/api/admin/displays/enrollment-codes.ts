import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "../lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/admin/displays/enrollment-codes")({
  server: {
    handlers: {
      POST: createProxyPostHandler(
        "/admin/displays/enrollment-codes",
        "admin-display-enrollment-codes",
      ),
    },
  },
});
