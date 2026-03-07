// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDisplayMock = vi.fn();
const updateDisplayMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () =>
    (config: { component: unknown }) => ({
      ...config,
      useParams: () => ({ displayId: "display-1" }),
    }),
  useNavigate: () => vi.fn(),
}));

vi.mock("#/lib/api/displays", () => ({
  getDisplay: (...args: unknown[]) => getDisplayMock(...args),
  updateDisplay: (...args: unknown[]) => updateDisplayMock(...args),
  revokeDisplaySession: vi.fn(),
  deleteDisplay: vi.fn(),
}));

const { AdminDisplayDetailPage } = await import("./$displayId");

describe("AdminDisplayDetailPage theme selector", () => {
  beforeEach(() => {
    getDisplayMock.mockReset();
    updateDisplayMock.mockReset();

    getDisplayMock.mockResolvedValue({
      id: "display-1",
      name: "Lobby",
      slug: "lobby",
      locationLabel: "Main Entrance",
      status: "ACTIVE",
      assignedProfileId: "default",
      themeId: "brutalist-high-density",
      updatedAt: "2026-03-07T12:00:00Z",
    });

    updateDisplayMock.mockResolvedValue({
      id: "display-1",
      name: "Lobby",
      slug: "lobby",
      locationLabel: "Main Entrance",
      status: "ACTIVE",
      assignedProfileId: "default",
      themeId: "default",
      updatedAt: "2026-03-07T12:00:00Z",
    });
  });

  it("loads and persists theme selection", async () => {
    render(<AdminDisplayDetailPage />);

    await waitFor(() => {
      expect(
        (screen.getByLabelText("Theme") as HTMLSelectElement).disabled,
      ).toBe(false);
    });

    const themeSelect = screen.getByLabelText("Theme") as HTMLSelectElement;
    expect(themeSelect.value).toBe("brutalist-high-density");

    fireEvent.change(themeSelect, { target: { value: "default" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Änderungen speichern" }),
    );

    await waitFor(() => {
      expect(updateDisplayMock).toHaveBeenCalledWith(
        "display-1",
        expect.objectContaining({ themeId: "default" }),
      );
    });
  });
});
