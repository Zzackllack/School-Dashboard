import { fetchJson } from "./http";

export interface CreateEnrollmentRequest {
  enrollmentCode: string;
  proposedDisplayName: string;
  deviceInfo?: unknown;
}

export interface CreateEnrollmentResponse {
  requestId: string;
  status: "PENDING";
  pollAfterSeconds: number;
}

export interface EnrollmentStatusResponse {
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  displayId: string | null;
  displaySessionToken: string | null;
  pollAfterSeconds: number | null;
}

export interface DisplaySessionValidationResponse {
  valid: boolean;
  displayId: string | null;
  displaySlug: string | null;
  assignedProfileId: string | null;
  redirectPath: string | null;
}

export interface PendingEnrollmentResponse {
  requestId: string;
  enrollmentCodeId: string;
  proposedDisplayName: string;
  deviceInfo: unknown;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  displayId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface DisplaySummaryResponse {
  id: string;
  name: string;
  slug: string;
  locationLabel: string | null;
  status: "ACTIVE" | "INACTIVE" | "REVOKED";
  assignedProfileId: string | null;
  updatedAt: string;
}

export interface CreateEnrollmentCodeResponse {
  codeId: string;
  code: string;
  expiresAt: string;
  maxUses: number;
}

export interface ApproveEnrollmentRequest {
  assignedProfileId?: string;
  locationLabel?: string;
  displayName?: string;
  displaySlug?: string;
}

export interface RejectEnrollmentRequest {
  reason?: string;
}

export interface UpdateDisplayRequest {
  name?: string;
  slug?: string;
  locationLabel?: string;
  assignedProfileId?: string;
  status?: "ACTIVE" | "INACTIVE" | "REVOKED";
}

export interface AdminAuthStatusResponse {
  authenticated: boolean;
  username: string | null;
  roles: string[];
}

interface CsrfTokenResponse {
  headerName: string;
  parameterName: string;
  token: string;
}

function isApiStatusError(error: unknown, status: number): boolean {
  return (
    error instanceof Error && error.message.startsWith(`API error: ${status}`)
  );
}

async function getAdminCsrfHeaders(
  initialHeaders?: HeadersInit,
): Promise<Headers> {
  const csrf = await fetchJson<CsrfTokenResponse>("/admin/auth/csrf");
  if (!csrf?.headerName || !csrf?.token) {
    throw new Error("CSRF token endpoint returned an invalid response");
  }

  const headers = new Headers(initialHeaders);
  headers.set(csrf.headerName, csrf.token);
  return headers;
}

export async function adminLogin(
  username: string,
  password: string,
): Promise<AdminAuthStatusResponse> {
  const headers = await getAdminCsrfHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetchJson<AdminAuthStatusResponse>("/admin/auth/login", {
    method: "POST",
    headers,
    body: JSON.stringify({ username, password }),
  });

  if (!response) {
    throw new Error("Admin login returned an empty response");
  }
  return response;
}

export async function adminLogout(): Promise<void> {
  const headers = await getAdminCsrfHeaders();
  await fetchJson<void>("/admin/auth/logout", {
    method: "POST",
    headers,
  });
}

export async function getAdminAuthStatus(): Promise<AdminAuthStatusResponse> {
  try {
    const response = await fetchJson<AdminAuthStatusResponse>("/admin/auth/me");
    if (!response) {
      return { authenticated: false, username: null, roles: [] };
    }
    return response;
  } catch (error) {
    if (isApiStatusError(error, 401)) {
      return { authenticated: false, username: null, roles: [] };
    }
    throw error;
  }
}

export async function createEnrollment(
  request: CreateEnrollmentRequest,
): Promise<CreateEnrollmentResponse> {
  const response = await fetchJson<CreateEnrollmentResponse>("/displays/enrollments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response) {
    throw new Error("Enrollment creation returned an empty response");
  }
  return response;
}

export async function getEnrollmentStatus(
  requestId: string,
): Promise<EnrollmentStatusResponse> {
  const response = await fetchJson<EnrollmentStatusResponse>(
    `/displays/enrollments/${encodeURIComponent(requestId)}`,
  );
  if (!response) {
    throw new Error("Enrollment status returned an empty response");
  }
  return response;
}

export async function validateDisplaySession(
  token: string,
): Promise<DisplaySessionValidationResponse> {
  const response = await fetchJson<DisplaySessionValidationResponse>(
    "/displays/session",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response) {
    return {
      valid: false,
      displayId: null,
      displaySlug: null,
      assignedProfileId: null,
      redirectPath: null,
    };
  }
  return response;
}

export async function createEnrollmentCode(payload: {
  ttlSeconds?: number;
  maxUses?: number;
}): Promise<CreateEnrollmentCodeResponse> {
  const headers = await getAdminCsrfHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetchJson<CreateEnrollmentCodeResponse>(
    "/admin/displays/enrollment-codes",
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );
  if (!response) {
    throw new Error("Enrollment code creation returned an empty response");
  }
  return response;
}

export async function listDisplayEnrollments(
  status = "PENDING",
): Promise<PendingEnrollmentResponse[]> {
  const response = await fetchJson<PendingEnrollmentResponse[]>(
    `/admin/displays/enrollments?status=${encodeURIComponent(status)}`,
  );
  return response ?? [];
}

export async function approveDisplayEnrollment(
  requestId: string,
  payload: ApproveEnrollmentRequest,
): Promise<EnrollmentStatusResponse> {
  const headers = await getAdminCsrfHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetchJson<EnrollmentStatusResponse>(
    `/admin/displays/enrollments/${encodeURIComponent(requestId)}/approve`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );
  if (!response) {
    throw new Error("Enrollment approval returned an empty response");
  }
  return response;
}

export async function rejectDisplayEnrollment(
  requestId: string,
  payload: RejectEnrollmentRequest,
): Promise<EnrollmentStatusResponse> {
  const headers = await getAdminCsrfHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetchJson<EnrollmentStatusResponse>(
    `/admin/displays/enrollments/${encodeURIComponent(requestId)}/reject`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    },
  );
  if (!response) {
    throw new Error("Enrollment rejection returned an empty response");
  }
  return response;
}

export async function listDisplays(): Promise<DisplaySummaryResponse[]> {
  const response = await fetchJson<DisplaySummaryResponse[]>("/admin/displays");
  return response ?? [];
}

export async function getDisplay(
  displayId: string,
): Promise<DisplaySummaryResponse> {
  const response = await fetchJson<DisplaySummaryResponse>(
    `/admin/displays/${encodeURIComponent(displayId)}`,
  );

  if (!response) {
    throw new Error("Display fetch returned an empty response");
  }
  return response;
}

export async function revokeDisplaySession(
  displayId: string,
): Promise<DisplaySummaryResponse> {
  const headers = await getAdminCsrfHeaders();
  const response = await fetchJson<DisplaySummaryResponse>(
    `/admin/displays/${encodeURIComponent(displayId)}/revoke-session`,
    {
      method: "POST",
      headers,
    },
  );

  if (!response) {
    throw new Error("Display revoke returned an empty response");
  }
  return response;
}

export async function updateDisplay(
  displayId: string,
  payload: UpdateDisplayRequest,
): Promise<DisplaySummaryResponse> {
  const headers = await getAdminCsrfHeaders({
    "Content-Type": "application/json",
  });
  const response = await fetchJson<DisplaySummaryResponse>(
    `/admin/displays/${encodeURIComponent(displayId)}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(payload),
    },
  );

  if (!response) {
    throw new Error("Display update returned an empty response");
  }
  return response;
}

export async function deleteDisplay(displayId: string): Promise<void> {
  const headers = await getAdminCsrfHeaders();
  await fetchJson<void>(`/admin/displays/${encodeURIComponent(displayId)}`, {
    method: "DELETE",
    headers,
  });
}
