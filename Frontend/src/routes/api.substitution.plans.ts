import { createFileRoute } from "@tanstack/react-router";
import { toBackendApiUrl } from "../lib/config/backend";

export const Route = createFileRoute("/api/substitution/plans")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const upstreamResponse = await fetch(
            toBackendApiUrl("/substitution/plans"),
          );

          return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: upstreamResponse.headers,
          });
        } catch (error) {
          console.warn("[api-proxy] substitution upstream unavailable", error);
          return Response.json(
            { message: "Backend unavailable" },
            { status: 503, statusText: "Service Unavailable" },
          );
        }
      },
    },
  },
});
