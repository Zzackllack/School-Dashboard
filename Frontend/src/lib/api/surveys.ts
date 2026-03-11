import { fetchJson } from "./http";

export type SurveyCategory = "PROBLEM" | "WUNSCH" | "ALLGEMEINES_FEEDBACK";

export interface SurveyDisplayContextResponse {
  displayId: string;
  displayName: string;
  locationLabel: string | null;
  themeId: string;
  acceptingFeedback: boolean;
}

export interface CreateSurveySubmissionRequest {
  displayId: string;
  category: SurveyCategory;
  message: string;
  name?: string;
  schoolClass?: string;
  contactAllowed?: boolean;
}

export interface CreateSurveySubmissionResponse {
  submissionId: string;
  createdAt: string;
  status: "RECORDED";
}

export interface AdminSurveyListItemResponse {
  id: string;
  displayId: string;
  displayName: string;
  locationLabel: string | null;
  category: SurveyCategory;
  message: string;
  submitterName: string | null;
  schoolClass: string | null;
  contactAllowed: boolean;
  createdAt: string;
}

export async function getSurveyDisplayContext(
  displayId: string,
): Promise<SurveyDisplayContextResponse> {
  const response = await fetchJson<SurveyDisplayContextResponse>(
    `/surveys/displays/${encodeURIComponent(displayId)}`,
  );

  if (!response) {
    throw new Error("Display-Kontext konnte nicht geladen werden.");
  }

  return response;
}

export async function createSurveySubmission(
  payload: CreateSurveySubmissionRequest,
): Promise<CreateSurveySubmissionResponse> {
  const response = await fetchJson<CreateSurveySubmissionResponse>(
    "/surveys/submissions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response) {
    throw new Error("Rückmeldung konnte nicht gespeichert werden.");
  }

  return response;
}

export async function listAdminSurveys(filters?: {
  category?: SurveyCategory;
  displayId?: string;
  query?: string;
  limit?: number;
}): Promise<AdminSurveyListItemResponse[]> {
  const params = new URLSearchParams();

  if (filters?.category) {
    params.set("category", filters.category);
  }
  if (filters?.displayId) {
    params.set("displayId", filters.displayId);
  }
  if (filters?.query) {
    params.set("query", filters.query);
  }
  if (typeof filters?.limit === "number") {
    params.set("limit", String(filters.limit));
  }

  const response = await fetchJson<AdminSurveyListItemResponse[]>(
    `/admin/surveys${params.size > 0 ? `?${params.toString()}` : ""}`,
  );

  return response ?? [];
}
