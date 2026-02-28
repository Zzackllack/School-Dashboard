import { createFileRoute } from "@tanstack/react-router";
import { toBackendApiUrl } from "../lib/config/backend";
import {
  isAbortError,
  UPSTREAM_TIMEOUT_MS,
} from "../lib/proxy/api-proxy-utils";

export const Route = createFileRoute("/api/calendar/events")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          UPSTREAM_TIMEOUT_MS,
        );

        try {
          const upstreamResponse = await fetch(
            toBackendApiUrl("/calendar/events", request.url),
            { signal: controller.signal },
          );

          return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: upstreamResponse.headers,
          });
        } catch (error) {
          if (isAbortError(error)) {
            console.warn("[api-proxy] calendar upstream timed out", error);
            return Response.json(
              { message: "Backend timeout" },
              { status: 504, statusText: "Gateway Timeout" },
            );
          }

          console.warn("[api-proxy] calendar upstream unavailable", error);
          return Response.json(
            { message: "Backend unavailable" },
            { status: 503, statusText: "Service Unavailable" },
          );
        } finally {
          clearTimeout(timeoutId);
        }
      },
    },
  },
});
