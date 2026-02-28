import { createFileRoute } from "@tanstack/react-router";
import { toBackendApiUrl } from "../lib/config/backend";

export const Route = createFileRoute("/api/calendar/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const upstreamResponse = await fetch(
            toBackendApiUrl("/calendar/events", request.url),
          );

          return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: upstreamResponse.headers,
          });
        } catch (error) {
          console.warn("[api-proxy] calendar upstream unavailable", error);
          return Response.json(
            { message: "Backend unavailable" },
            { status: 503, statusText: "Service Unavailable" },
          );
        }
      },
    },
  },
});
