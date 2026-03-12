import { createFileRoute } from "@tanstack/react-router";
import { proxyTransportRestGetRequest } from "#/lib/proxy/transport-rest-proxy";

export const Route = createFileRoute("/api/transport/stops/nearby" as never)({
  server: {
    handlers: {
      GET: ({ request }) =>
        proxyTransportRestGetRequest(
          "/locations/nearby",
          request,
          "transport-nearby-stops",
        ),
    },
  },
});
