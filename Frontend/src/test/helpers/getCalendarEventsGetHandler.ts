import { Route } from "../../routes/api/calendar/events";

export function getCalendarEventsGetHandler() {
  const handlers = (Route.options.server as { handlers?: unknown } | undefined)
    ?.handlers;
  if (!handlers) {
    throw new Error("Route server handlers are not configured");
  }

  const resolvedHandlers =
    typeof handlers === "function" ? handlers({} as never) : handlers;
  return (
    resolvedHandlers as {
      GET: (ctx: { request: Request }) => Promise<Response>;
    }
  ).GET;
}
