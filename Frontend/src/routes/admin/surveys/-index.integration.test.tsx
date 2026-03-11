// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listAdminSurveysMock = vi.fn();
const listDisplaysMock = vi.fn();
const getAdminAuthStatusMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: { component: unknown }) => config,
  redirect: vi.fn(),
}));

vi.mock("#/lib/api/displays", () => ({
  listDisplays: (...args: unknown[]) => listDisplaysMock(...args),
  getAdminAuthStatus: (...args: unknown[]) => getAdminAuthStatusMock(...args),
}));

vi.mock("#/lib/api/surveys", () => ({
  listAdminSurveys: (...args: unknown[]) => listAdminSurveysMock(...args),
}));

const { AdminSurveysPage } = await import("./index");

describe("admin surveys inbox", () => {
  beforeEach(() => {
    listAdminSurveysMock.mockReset();
    listDisplaysMock.mockReset();
    getAdminAuthStatusMock.mockReset();

    getAdminAuthStatusMock.mockResolvedValue({
      authenticated: true,
      username: "admin",
      roles: ["ROLE_ADMIN"],
    });
    listDisplaysMock.mockResolvedValue([
      { id: "display-1", name: "Haupteingang", locationLabel: "Lobby" },
    ]);
    listAdminSurveysMock.mockResolvedValue([
      {
        id: "survey-1",
        displayId: "display-1",
        displayName: "Haupteingang",
        locationLabel: "Lobby",
        category: "PROBLEM",
        message: "Der QR-Code ist schwer scanbar.",
        submitterName: "Mila",
        schoolClass: "10a",
        contactAllowed: true,
        createdAt: "2026-03-09T15:04:00Z",
      },
    ]);
  });

  it("renders inbox entries and applies filters", async () => {
    render(<AdminSurveysPage />);

    await screen.findByText("Der QR-Code ist schwer scanbar.");
    expect(screen.getByText("Klasse: 10a")).toBeDefined();
    expect(screen.getByText("Rückkontakt: Erlaubt")).toBeDefined();

    fireEvent.change(screen.getByLabelText("Kategorie"), {
      target: { value: "PROBLEM" },
    });
    fireEvent.change(screen.getByLabelText("Freitextsuche"), {
      target: { value: "scanbar" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filter anwenden" }));

    await waitFor(() => {
      expect(listAdminSurveysMock).toHaveBeenLastCalledWith({
        category: "PROBLEM",
        displayId: undefined,
        query: "scanbar",
        limit: 50,
      });
    });
  });
});
