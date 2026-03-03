import { afterEach, describe, expect, it, vi } from "vitest";
import {
  approveDisplayEnrollment,
  createEnrollment,
  createEnrollmentCode,
  validateDisplaySession,
} from "./displays";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("display api client", () => {
  it("creates enrollment with POST payload", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "request-1",
          status: "PENDING",
          pollAfterSeconds: 5,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const response = await createEnrollment({
      enrollmentCode: "ABCD1234",
      proposedDisplayName: "Lobby",
    });

    expect(response.requestId).toBe("request-1");
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/displays/enrollments",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("passes admin token headers for code creation", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          codeId: "code-1",
          code: "ABCD1234",
          expiresAt: "2026-01-01T10:00:00Z",
          maxUses: 5,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await createEnrollmentCode(
      { adminToken: "admin-secret", adminPassword: "1234" },
      { ttlSeconds: 300, maxUses: 5 },
    );

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get("x-admin-token")).toBe("admin-secret");
    expect(headers.get("x-admin-password")).toBe("1234");
  });

  it("validates session with bearer token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          valid: true,
          displayId: "display-1",
          displaySlug: "lobby",
          assignedProfileId: "default",
          redirectPath: "/display/display-1",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const response = await validateDisplaySession("token-123");

    expect(response.valid).toBe(true);
    expect(response.displayId).toBe("display-1");
  });

  it("approves enrollment request via admin endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          requestId: "request-1",
          status: "APPROVED",
          displayId: "display-1",
          displaySessionToken: "token-123",
          pollAfterSeconds: null,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await approveDisplayEnrollment(
      { adminToken: "admin-secret", adminPassword: "1234" },
      "request-1",
      {},
    );

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/displays/enrollments/request-1/approve",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
