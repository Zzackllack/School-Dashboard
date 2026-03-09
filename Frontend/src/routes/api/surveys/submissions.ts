import { createFileRoute } from "@tanstack/react-router";
import { createProxyPostHandler } from "#/lib/proxy/proxy-get-handler";

export const Route = createFileRoute("/api/surveys/submissions" as never)({
  server: {
    handlers: {
      POST: createProxyPostHandler("/surveys/submissions", "survey-submission"),
    },
  },
});
