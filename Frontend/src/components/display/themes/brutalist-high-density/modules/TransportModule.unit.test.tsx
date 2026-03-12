// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
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
    if (when.includes("later")) return 9;
    if (when.includes("past")) return -1;
    return mockedMinutes;
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
        {
          tripId: "bus-2",
          direction: "Zehlendorf",
          line: { name: "X11", product: "bus" },
          when: "later-bus-1",
          plannedWhen: "later-bus-1",
          delay: null,
        },
        {
          tripId: "bus-3",
          direction: "Mexikoplatz",
          line: { name: "M48", product: "bus" },
          when: "later-bus-2",
          plannedWhen: "later-bus-2",
          delay: null,
        },
        {
          tripId: "bus-4",
          direction: "Potsdam",
          line: { name: "285", product: "bus" },
          when: "later-bus-3",
          plannedWhen: "later-bus-3",
          delay: null,
        },
        {
          tripId: "bus-past",
          direction: "Schon weg",
          line: { name: "N12", product: "bus" },
          when: "past-bus",
          plannedWhen: "past-bus",
          delay: null,
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
        {
          tripId: "sbahn-2",
          direction: "Frohnau",
          line: { name: "S1", product: "suburban" },
          when: "later-sbahn-1",
          plannedWhen: "later-sbahn-1",
          delay: null,
        },
        {
          tripId: "sbahn-3",
          direction: "Oranienburg",
          line: { name: "S25", product: "suburban" },
          when: "later-sbahn-2",
          plannedWhen: "later-sbahn-2",
          delay: null,
        },
        {
          tripId: "sbahn-4",
          direction: "Hennigsdorf",
          line: { name: "S26", product: "suburban" },
          when: "later-sbahn-3",
          plannedWhen: "later-sbahn-3",
          delay: null,
        },
        {
          tripId: "sbahn-past",
          direction: "Schon weg",
          line: { name: "S2", product: "suburban" },
          when: "past-sbahn",
          plannedWhen: "past-sbahn",
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
    expect(screen.getByText("Goethestr./Drakestr.")).toBeDefined();
    expect(screen.getAllByText("S Lichterfelde West")).toHaveLength(2);
    expect(screen.getAllByText("M11")).toHaveLength(1);
    expect(screen.getAllByText("S1")).toHaveLength(2);
  });

  it("shows only the next three upcoming departures per section", () => {
    mockedMinutes = 3;
    render(<TransportModule />);

    const sections = screen.getAllByRole("heading", {
      level: 3,
    });
    const busSection = sections[0]?.closest("section");
    const sBahnSection = sections[1]?.closest("section");

    expect(busSection).not.toBeNull();
    expect(sBahnSection).not.toBeNull();

    const bus = within(busSection!);
    const sBahn = within(sBahnSection!);

    expect(bus.getByText("M11")).toBeDefined();
    expect(bus.getByText("X11")).toBeDefined();
    expect(bus.getByText("M48")).toBeDefined();
    expect(bus.queryByText("285")).toBeNull();
    expect(bus.queryByText("N12")).toBeNull();

    expect(sBahn.getAllByText("S1")).toHaveLength(2);
    expect(sBahn.getByText("S25")).toBeDefined();
    expect(sBahn.queryByText("S26")).toBeNull();
    expect(sBahn.queryByText("S2")).toBeNull();
  });
});
