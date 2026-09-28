// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getSurveyDisplayContextMock = vi.fn();
const createSurveySubmissionMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: { component: unknown }) => ({
    ...config,
    useParams: () => ({ displayId: "display-1" }),
  }),
  useParams: () => ({ displayId: "display-1" }),
}));

vi.mock("#/lib/api/surveys", () => ({
  getSurveyDisplayContext: (...args: unknown[]) =>
    getSurveyDisplayContextMock(...args),
  createSurveySubmission: (...args: unknown[]) =>
    createSurveySubmissionMock(...args),
}));

const { SurveyFeedbackPage } = await import("./$displayId");

// The route reads its display context through useQuery, so it needs the same
// provider the router sets up in src/router.tsx.
function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SurveyFeedbackPage />
    </QueryClientProvider>,
  );
}

describe("survey feedback route", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    getSurveyDisplayContextMock.mockReset();
    createSurveySubmissionMock.mockReset();

    getSurveyDisplayContextMock.mockResolvedValue({
      displayId: "display-1",
      displayName: "Haupteingang",
      locationLabel: "Lobby",
      themeId: "default",
      acceptingFeedback: true,
    });
    createSurveySubmissionMock.mockResolvedValue({
      submissionId: "submission-1",
      createdAt: "2026-03-09T15:04:00Z",
      status: "RECORDED",
    });
  });

  it("loads context and submits valid feedback", async () => {
    renderPage();

    await screen.findByText("Haupteingang");

    fireEvent.change(screen.getByLabelText("Kategorie"), {
      target: { value: "PROBLEM" },
    });
    fireEvent.change(screen.getByLabelText("Nachricht"), {
      target: { value: "Der QR-Code ist auf dem Display zu klein." },
    });
    fireEvent.change(screen.getByLabelText("Name (optional)"), {
      target: { value: "Mila" },
    });
    fireEvent.change(screen.getByLabelText("Klasse (optional)"), {
      target: { value: "10a" },
    });
    fireEvent.click(
      screen.getByLabelText(
        /Admins dürfen auf mich zukommen, falls Rückfragen oder mehr/,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Feedback senden" }));

    await waitFor(() => {
      expect(createSurveySubmissionMock).toHaveBeenCalledWith({
        displayId: "display-1",
        category: "PROBLEM",
        message: "Der QR-Code ist auf dem Display zu klein.",
        name: "Mila",
        schoolClass: "10a",
        contactAllowed: true,
      });
    });

    expect(screen.getByText("Rückmeldung gesendet")).toBeDefined();
  });

  it("shows a German validation message for an empty message", async () => {
    renderPage();

    await screen.findByText("Haupteingang");

    fireEvent.change(screen.getByLabelText("Kategorie"), {
      target: { value: "PROBLEM" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Feedback senden" }));

    expect(screen.getByText("Bitte gib eine Nachricht ein.")).toBeDefined();
    expect(createSurveySubmissionMock).not.toHaveBeenCalled();
  });
});
