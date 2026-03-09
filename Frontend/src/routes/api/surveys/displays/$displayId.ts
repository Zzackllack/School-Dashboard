import { createFileRoute } from "@tanstack/react-router";
import { createProxyGetHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/surveys/displays/$displayId" as never)({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        createProxyGetHandler(
          `/surveys/displays/${encodeURIComponent(
            (params as { displayId: string }).displayId,
          )}`,
          "survey-display-context",
        )({ request }),
    },
  },
});
