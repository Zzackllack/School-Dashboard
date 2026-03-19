// @vitest-environment jsdom
import { act } from "react";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getEnrollmentStatusMock = vi.fn();
const navigateMock = vi.fn();
const setDisplayIdHintMock = vi.fn();
const setPendingEnrollmentRequestIdMock = vi.fn();

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
    clear() {
      values.clear();
    },
  };
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <>{children}</>,
  createFileRoute: () => (config: { component: unknown }) => ({
    ...config,
    useSearch: () => ({ requestId: "req-1" }),
  }),
  useNavigate: () => navigateMock,
}));

vi.mock("#/lib/api/displays", () => ({
  getEnrollmentStatus: (...args: unknown[]) => getEnrollmentStatusMock(...args),
}));

vi.mock("#/lib/display-session", () => ({
  getPendingEnrollmentRequestId: vi.fn(() => "req-1"),
  setDisplayIdHint: (...args: unknown[]) => setDisplayIdHintMock(...args),
  setPendingEnrollmentRequestId: (...args: unknown[]) =>
    setPendingEnrollmentRequestIdMock(...args),
}));

const { SetupPendingPage } = await import("./pending");

describe("setup pending route", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-19T12:00:00Z"));
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
    });
    getEnrollmentStatusMock.mockReset();
    navigateMock.mockReset();
    setDisplayIdHintMock.mockReset();
    setPendingEnrollmentRequestIdMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("applies a client-side floor to rapid pending polls", async () => {
    getEnrollmentStatusMock.mockResolvedValue({
      requestId: "req-1",
      status: "PENDING",
      displayId: null,
      displaySessionToken: null,
      pollAfterSeconds: 1,
    });

    render(<SetupPendingPage />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(getEnrollmentStatusMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_000);
    });
    expect(getEnrollmentStatusMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(getEnrollmentStatusMock).toHaveBeenCalledTimes(2);
  });

  it("backs off polling errors for 15 seconds before retrying", async () => {
    getEnrollmentStatusMock.mockRejectedValue(new Error("network down"));

    render(<SetupPendingPage />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(getEnrollmentStatusMock).toHaveBeenCalledTimes(1);

    expect(
      screen.getByText(/network down Neuer Versuch in 15s\./),
    ).toBeDefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14_000);
    });
    expect(getEnrollmentStatusMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(getEnrollmentStatusMock).toHaveBeenCalledTimes(2);
  });
});
