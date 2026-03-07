import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/displays/enrollments/")({
  server: {
    handlers: {
      POST: createProxyPostHandler(
        "/displays/enrollments",
        "display-enrollments",
      ),
    },
  },
});
