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

function adminHeaders(adminToken: string): HeadersInit {
  return {
    "X-Admin-Token": adminToken,
    "Content-Type": "application/json",
  };
}

export async function createEnrollment(
  request: CreateEnrollmentRequest,
): Promise<CreateEnrollmentResponse> {
  const response = await fetchJson<CreateEnrollmentResponse>(
    "/displays/enrollments",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

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

export async function createEnrollmentCode(
  adminToken: string,
  payload: { ttlSeconds?: number; maxUses?: number },
): Promise<CreateEnrollmentCodeResponse> {
  const response = await fetchJson<CreateEnrollmentCodeResponse>(
    "/admin/displays/enrollment-codes",
    {
      method: "POST",
      headers: adminHeaders(adminToken),
      body: JSON.stringify(payload),
    },
  );
  if (!response) {
    throw new Error("Enrollment code creation returned an empty response");
  }
  return response;
}

export async function listDisplayEnrollments(
  adminToken: string,
  status = "PENDING",
): Promise<PendingEnrollmentResponse[]> {
  const response = await fetchJson<PendingEnrollmentResponse[]>(
    `/admin/displays/enrollments?status=${encodeURIComponent(status)}`,
    {
      headers: {
        "X-Admin-Token": adminToken,
      },
    },
  );
  return response ?? [];
}

export async function approveDisplayEnrollment(
  adminToken: string,
  requestId: string,
  payload: ApproveEnrollmentRequest,
): Promise<EnrollmentStatusResponse> {
  const response = await fetchJson<EnrollmentStatusResponse>(
    `/admin/displays/enrollments/${encodeURIComponent(requestId)}/approve`,
    {
      method: "POST",
      headers: adminHeaders(adminToken),
      body: JSON.stringify(payload),
    },
  );
  if (!response) {
    throw new Error("Enrollment approval returned an empty response");
  }
  return response;
}

export async function rejectDisplayEnrollment(
  adminToken: string,
  requestId: string,
  payload: RejectEnrollmentRequest,
): Promise<EnrollmentStatusResponse> {
  const response = await fetchJson<EnrollmentStatusResponse>(
    `/admin/displays/enrollments/${encodeURIComponent(requestId)}/reject`,
    {
      method: "POST",
      headers: adminHeaders(adminToken),
      body: JSON.stringify(payload),
    },
  );
  if (!response) {
    throw new Error("Enrollment rejection returned an empty response");
  }
  return response;
}

export async function listDisplays(
  adminToken: string,
): Promise<DisplaySummaryResponse[]> {
  const response = await fetchJson<DisplaySummaryResponse[]>("/admin/displays", {
    headers: {
      "X-Admin-Token": adminToken,
    },
  });

  return response ?? [];
}

export async function getDisplay(
  adminToken: string,
  displayId: string,
): Promise<DisplaySummaryResponse> {
  const response = await fetchJson<DisplaySummaryResponse>(
    `/admin/displays/${encodeURIComponent(displayId)}`,
    {
      headers: {
        "X-Admin-Token": adminToken,
      },
    },
  );

  if (!response) {
    throw new Error("Display fetch returned an empty response");
  }
  return response;
}

export async function revokeDisplaySession(
  adminToken: string,
  displayId: string,
): Promise<DisplaySummaryResponse> {
  const response = await fetchJson<DisplaySummaryResponse>(
    `/admin/displays/${encodeURIComponent(displayId)}/revoke-session`,
    {
      method: "POST",
      headers: {
        "X-Admin-Token": adminToken,
      },
    },
  );

  if (!response) {
    throw new Error("Display revoke returned an empty response");
  }
  return response;
}

export async function updateDisplay(
  adminToken: string,
  displayId: string,
  payload: UpdateDisplayRequest,
): Promise<DisplaySummaryResponse> {
  const response = await fetchJson<DisplaySummaryResponse>(
    `/admin/displays/${encodeURIComponent(displayId)}`,
    {
      method: "PATCH",
      headers: adminHeaders(adminToken),
      body: JSON.stringify(payload),
    },
  );

  if (!response) {
    throw new Error("Display update returned an empty response");
  }
  return response;
}
