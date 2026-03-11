// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TransportModule } from "./TransportModule";

let mockedMinutes = 3;

vi.mock("../themeShared", () => ({
  lineBadgeCls: (product: string) =>
    product === "suburban"
      ? "bg-[#009252] text-white"
      : "bg-[#8B008B] text-white",
  minsUntil: (when: string | null) => {
    if (!when) return 0;
    return when.includes("soon") ? mockedMinutes : 6;
  },
  useTransport: () => ({
    bus: {
      stopName: "Goethestr./Drakestr.",
      departures: [
        {
          tripId: "bus-1",
          direction: "S Lichterfelde West",
          line: { name: "M11", product: "bus" },
          when: "soon-bus",
          plannedWhen: "soon-bus",
          delay: 60,
        },
      ],
      loading: false,
    },
    sBahn: {
      stopName: "S Lichterfelde West",
      departures: [
        {
          tripId: "sbahn-1",
          direction: "Wannsee",
          line: { name: "S1", product: "suburban" },
          when: "soon-sbahn",
          plannedWhen: "soon-sbahn",
          delay: null,
        },
      ],
      loading: false,
    },
    loading: false,
    initialLoaded: true,
  }),
}));

describe("Brutalist transport module", () => {
  it("renders separate bus and S-Bahn sections", () => {
    mockedMinutes = 3;
    render(<TransportModule />);

    expect(screen.getByRole("heading", { name: "Bus" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "S-Bahn" })).toBeDefined();
    expect(screen.getAllByText("Goethestr./Drakestr.")).toHaveLength(2);
    expect(screen.getAllByText("S Lichterfelde West")).toHaveLength(2);
    expect(screen.getByText("M11")).toBeDefined();
    expect(screen.getByText("S1")).toBeDefined();
  });

  it("updates the countdown value when departure minutes change", () => {
    mockedMinutes = 5;
    const { rerender } = render(<TransportModule />);

    expect(screen.getAllByLabelText("Abfahrt in 5 Minuten")).toHaveLength(2);

    mockedMinutes = 4;
    rerender(<TransportModule />);

    expect(screen.getAllByLabelText("Abfahrt in 4 Minuten")).toHaveLength(2);
  });
});
