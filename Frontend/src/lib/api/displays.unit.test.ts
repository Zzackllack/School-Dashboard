import { afterEach, describe, expect, it, vi } from "vitest";
import {
  adminLogin,
  approveDisplayEnrollment,
  createEnrollment,
  createEnrollmentCode,
  updateAdminCredentials,
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

  it("creates enrollment code with csrf protection", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            headerName: "X-CSRF-TOKEN",
            parameterName: "_csrf",
            token: "csrf-123",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
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

    await createEnrollmentCode({ ttlSeconds: 300, maxUses: 5 });

    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      "/api/admin/auth/csrf",
      undefined,
    );

    const [, init] = fetchSpy.mock.calls[1] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get("x-csrf-token")).toBe("csrf-123");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("logs in admin using username/password", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            headerName: "X-CSRF-TOKEN",
            parameterName: "_csrf",
            token: "csrf-123",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            authenticated: true,
            username: "admin",
            roles: ["ROLE_ADMIN"],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const response = await adminLogin("admin", "password");

    expect(response.authenticated).toBe(true);
    const [, init] = fetchSpy.mock.calls[1] ?? [];
    const requestInit = init as RequestInit;
    expect(requestInit.method).toBe("POST");
    expect(requestInit.body).toContain("admin");
    const headers = new Headers(requestInit.headers);
    expect(headers.get("x-csrf-token")).toBe("csrf-123");
  });

  it("validates session with credentialed request", async () => {
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

    const response = await validateDisplaySession();

    expect(response.valid).toBe(true);
    expect(response.displayId).toBe("display-1");
  });

  it("approves enrollment request via csrf-protected admin endpoint", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            headerName: "X-CSRF-TOKEN",
            parameterName: "_csrf",
            token: "csrf-123",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
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

    await approveDisplayEnrollment("request-1", {});

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/admin/displays/enrollments/request-1/approve",
      expect.objectContaining({ method: "POST" }),
    );

    const [, init] = fetchSpy.mock.calls[1] ?? [];
    const headers = new Headers((init as RequestInit | undefined)?.headers);
    expect(headers.get("x-csrf-token")).toBe("csrf-123");
  });

  it("updates admin credentials with csrf protection", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            headerName: "X-CSRF-TOKEN",
            parameterName: "_csrf",
            token: "csrf-123",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            authenticated: true,
            username: "renamed-admin",
            roles: ["ROLE_ADMIN"],
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );

    const response = await updateAdminCredentials({
      currentPassword: "old-password",
      newUsername: "renamed-admin",
      newPassword: "new-password",
    });

    expect(response.username).toBe("renamed-admin");
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api/admin/auth/credentials",
      expect.objectContaining({ method: "POST" }),
    );
    const [, init] = fetchSpy.mock.calls[1] ?? [];
    const requestInit = init as RequestInit;
    expect(requestInit.body).toContain("renamed-admin");
    const headers = new Headers(requestInit.headers);
    expect(headers.get("x-csrf-token")).toBe("csrf-123");
  });
});
