import { toFrontendApiPath } from "../config/backend";

export async function fetchJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | undefined> {
  const response = await fetch(toFrontendApiPath(path), init);

  if (!response.ok) {
    const errorBody = await response.text();
    const suffix = errorBody ? ` - ${errorBody}` : "";
    throw new Error(`API error: ${response.status}${suffix}`);
  }

  const contentLength = response.headers.get("Content-Length");
  const contentType = response.headers.get("Content-Type");
  if (
    response.status === 204 ||
    contentLength === "0" ||
    !contentType ||
    !contentType.toLowerCase().includes("application/json")
  ) {
    return undefined;
  }

  const responseBody = await response.text();
  if (responseBody.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(responseBody) as T;
  } catch (error) {
    const responsePreview = responseBody.slice(0, 200);
    throw new Error(
      `Failed to parse JSON response for ${path}: ${responsePreview}`,
      { cause: error },
    );
  }
}
