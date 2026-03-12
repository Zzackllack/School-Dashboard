import { Route } from "../../routes/api/transport/stops/$stopId/departures";

export function getTransportStopDeparturesGetHandler() {
  const handlers = (Route.options.server as { handlers?: unknown } | undefined)
    ?.handlers;
  if (!handlers) {
    throw new Error("Route server handlers are not configured");
  }

  const resolvedHandlers =
    typeof handlers === "function" ? handlers({} as never) : handlers;
  return (
    resolvedHandlers as {
      GET: (ctx: {
        request: Request;
        params: { stopId: string };
      }) => Promise<Response>;
    }
  ).GET;
}
