// @vitest-environment jsdom
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
    render(<SurveyFeedbackPage />);

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
        /Admins duerfen auf mich zukommen, falls Rueckfragen oder mehr/,
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

    expect(screen.getByText("Rueckmeldung gesendet")).toBeDefined();
  });

  it("shows a German validation message for an empty message", async () => {
    render(<SurveyFeedbackPage />);

    await screen.findByText("Haupteingang");

    fireEvent.change(screen.getByLabelText("Kategorie"), {
      target: { value: "PROBLEM" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Feedback senden" }));

    expect(screen.getByText("Bitte gib eine Nachricht ein.")).toBeDefined();
    expect(createSurveySubmissionMock).not.toHaveBeenCalled();
  });
});
