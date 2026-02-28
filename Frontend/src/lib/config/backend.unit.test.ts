import { afterEach, describe, expect, it } from "vitest";
import {
  getBackendOrigin,
  toBackendApiUrl,
  toFrontendApiPath,
} from "./backend";

const originalBackendUrl = process.env.BACKEND_URL;

afterEach(() => {
  if (originalBackendUrl === undefined) {
    delete process.env.BACKEND_URL;
  } else {
    process.env.BACKEND_URL = originalBackendUrl;
  }
});

describe("backend config helpers", () => {
  it("normalizes frontend API paths", () => {
    expect(toFrontendApiPath("/substitution/plans")).toBe(
      "/api/substitution/plans",
    );
    expect(toFrontendApiPath("/api/calendar/events")).toBe(
      "/api/calendar/events",
    );
    expect(toFrontendApiPath("/apiary/events")).toBe("/api/apiary/events");
  });

  it("builds backend URLs with runtime env overrides", () => {
    process.env.BACKEND_URL = "http://backend:8080/";

    expect(getBackendOrigin()).toBe("http://backend:8080");
    expect(toBackendApiUrl("/substitution/plans").toString()).toBe(
      "http://backend:8080/api/substitution/plans",
    );
  });

  it("keeps request query params when forwarding", () => {
    process.env.BACKEND_URL = "http://backend:8080";

    const target = toBackendApiUrl(
      "/calendar/events",
      "https://dashboard.local/api/calendar/events?limit=7",
    );

    expect(target.toString()).toBe(
      "http://backend:8080/api/calendar/events?limit=7",
    );
  });
});
