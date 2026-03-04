import { toBackendApiUrl } from "../config/backend";
import { isAbortError, UPSTREAM_TIMEOUT_MS } from "./api-proxy-utils";

const FORWARDED_HEADERS = [
  "accept",
  "accept-language",
  "authorization",
  "cookie",
  "content-type",
  "x-csrf-token",
  "x-xsrf-token",
  "x-request-id",
];

export async function proxyGetRequest(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  upstreamPath: string,
  request: Request,
  resourceName: string,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const init: RequestInit = {
      method,
      signal: controller.signal,
      headers: copyForwardedHeaders(request),
    };

    if (method !== "GET") {
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        init.body = body;
      }
    }

    const upstreamResponse = await fetch(
      toBackendApiUrl(upstreamPath, request.url),
      init,
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
    proxyGetRequest("GET", upstreamPath, request, resourceName);
}

export function createProxyPostHandler(
  upstreamPath: string,
  resourceName: string,
) {
  return async ({ request }: { request: Request }) =>
    proxyGetRequest("POST", upstreamPath, request, resourceName);
}

export function createProxyPatchHandler(
  upstreamPath: string,
  resourceName: string,
) {
  return async ({ request }: { request: Request }) =>
    proxyGetRequest("PATCH", upstreamPath, request, resourceName);
}

export function createProxyDeleteHandler(
  upstreamPath: string,
  resourceName: string,
) {
  return async ({ request }: { request: Request }) =>
    proxyGetRequest("DELETE", upstreamPath, request, resourceName);
}

function copyForwardedHeaders(request: Request): Headers {
  const headers = new Headers();
  for (const header of FORWARDED_HEADERS) {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }
  return headers;
}
