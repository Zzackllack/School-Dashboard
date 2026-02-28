const DEFAULT_BACKEND_ORIGIN = "http://localhost:8080";

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function normalizeApiPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/api" || normalized.startsWith("/api/")
    ? normalized
    : `/api${normalized}`;
}

export function getBackendOrigin(): string {
  const runtimeOrigin =
    (typeof process !== "undefined" ? process.env.BACKEND_URL : undefined) ||
    import.meta.env.VITE_BACKEND_URL ||
    DEFAULT_BACKEND_ORIGIN;

  return stripTrailingSlash(runtimeOrigin);
}

export function toFrontendApiPath(path: string): string {
  return normalizeApiPath(path);
}

export function toBackendApiUrl(path: string, requestUrl?: string): URL {
  const backendOrigin = getBackendOrigin();
  const target = new URL(normalizeApiPath(path), `${backendOrigin}/`);

  if (requestUrl) {
    try {
      target.search = new URL(requestUrl).search;
    } catch {
      target.search = "";
    }
  }

  return target;
}
