import { toBackendApiUrl } from "../config/backend";
import { isAbortError, UPSTREAM_TIMEOUT_MS } from "./api-proxy-utils";

export async function proxyGetRequest(
  upstreamPath: string,
  request: Request,
  resourceName: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(
      toBackendApiUrl(upstreamPath, request.url),
      { signal: controller.signal },
    );

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: upstreamResponse.headers,
    });
  } catch (error) {
    if (isAbortError(error)) {
      console.warn(`[api-proxy] ${resourceName} upstream timed out`, error);
      return Response.json(
        { message: "Backend timeout" },
        { status: 504, statusText: "Gateway Timeout" },
      );
    }

    console.warn(`[api-proxy] ${resourceName} upstream unavailable`, error);
    return Response.json(
      { message: "Backend unavailable" },
      { status: 503, statusText: "Service Unavailable" },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createProxyGetHandler(
  upstreamPath: string,
  resourceName: string,
) {
  return async ({ request }: { request: Request }) =>
    proxyGetRequest(upstreamPath, request, resourceName);
}
