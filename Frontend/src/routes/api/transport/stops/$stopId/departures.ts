import { createFileRoute } from "@tanstack/react-router";
import { proxyTransportRestGetRequest } from "#/lib/proxy/transport-rest-proxy";

export const Route = createFileRoute(
  "/api/transport/stops/$stopId/departures" as never,
)({
  server: {
    handlers: {
      GET: ({
        request,
        params,
      }: {
        request: Request;
        params: { stopId: string };
      }) =>
        proxyTransportRestGetRequest(
          `/stops/${encodeURIComponent(params.stopId)}/departures`,
          request,
          "transport-stop-departures",
        ),
    },
  },
});
