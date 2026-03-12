import { isAbortError, UPSTREAM_TIMEOUT_MS } from "./api-proxy-utils";

const BVG_TRANSPORT_REST_ORIGIN = "https://v6.bvg.transport.rest";
const STRIPPED_RESPONSE_HEADERS = [
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "transfer-encoding",
];

function buildBvgUpstreamUrl(pathname: string, requestUrl: string) {
  const target = new URL(pathname, BVG_TRANSPORT_REST_ORIGIN);
  target.search = new URL(requestUrl).search;
  return target;
}

export async function proxyTransportRestGetRequest(
  pathname: string,
  request: Request,
  resourceName: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamUrl = buildBvgUpstreamUrl(pathname, request.url);
    console.info(`[transport-proxy] ${resourceName} request`, {
      pathname,
      upstreamUrl: upstreamUrl.toString(),
    });

    const upstreamResponse = await fetch(upstreamUrl, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
      signal: controller.signal,
    });

    console.info(`[transport-proxy] ${resourceName} response`, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      upstreamUrl: upstreamUrl.toString(),
    });

    const responseHeaders = sanitizeProxyResponseHeaders(upstreamResponse);
    responseHeaders.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    responseHeaders.set("Pragma", "no-cache");
    responseHeaders.set("Expires", "0");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    if (isAbortError(error)) {
      console.warn(`[transport-proxy] ${resourceName} upstream timed out`, {
        pathname,
        requestUrl: request.url,
        error,
      });
      return Response.json(
        { message: "Transport API timeout" },
        { status: 504, statusText: "Gateway Timeout" },
      );
    }

    console.warn(`[transport-proxy] ${resourceName} upstream unavailable`, {
      pathname,
      requestUrl: request.url,
      error,
    });
    return Response.json(
      { message: "Transport API unavailable" },
      { status: 503, statusText: "Service Unavailable" },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeProxyResponseHeaders(upstreamResponse: Response) {
  const headers = new Headers(upstreamResponse.headers);
  for (const header of STRIPPED_RESPONSE_HEADERS) {
    headers.delete(header);
  }
  return headers;
}
