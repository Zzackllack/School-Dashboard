import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPendingPollState,
  clearSessionRetryState,
  formatRetryDelay,
  getPendingPollDelayMs,
  getSessionRetryDelayMs,
  recordPendingPollError,
  recordSessionRetryFailure,
} from "./client-backoff";

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
  };
}

describe("client backoff", () => {
  const storage = createMemoryStorage();

  beforeEach(() => {
    clearSessionRetryState("bootstrap-session", { storage });
    clearPendingPollState("request-1", { storage });
  });

  it("formats retry delays for status messages", () => {
    expect(formatRetryDelay(5_000)).toBe("5s");
    expect(formatRetryDelay(61_000)).toBe("1m 1s");
  });

  it("persists exponential session retry delays", () => {
    const now = 1_000;

    const firstDelay = recordSessionRetryFailure("bootstrap-session", {
      storage,
      now,
    });
    const secondDelay = recordSessionRetryFailure("bootstrap-session", {
      storage,
      now: now + firstDelay,
    });

    expect(firstDelay).toBe(30_000);
    expect(secondDelay).toBe(60_000);
    expect(
      getSessionRetryDelayMs("bootstrap-session", {
        storage,
        now: now + firstDelay + 15_000,
      }),
    ).toBe(45_000);
  });

  it("enforces slower pending polling the longer a request stays pending", () => {
    const now = 10_000;

    expect(
      getPendingPollDelayMs("request-1", 1, {
        storage,
        now,
      }),
    ).toBe(5_000);

    expect(
      getPendingPollDelayMs("request-1", 1, {
        storage,
        now: now + 2 * 60_000,
      }),
    ).toBe(15_000);

    expect(
      getPendingPollDelayMs("request-1", 1, {
        storage,
        now: now + 10 * 60_000,
      }),
    ).toBe(30_000);
  });

  it("backs off pending polling errors independently from steady-state polling", () => {
    const now = 5_000;

    expect(recordPendingPollError("request-1", { storage, now })).toBe(15_000);
    expect(
      recordPendingPollError("request-1", {
        storage,
        now: now + 15_000,
      }),
    ).toBe(30_000);

    expect(
      getPendingPollDelayMs("request-1", 1, {
        storage,
        now: now + 46_000,
      }),
    ).toBe(5_000);
  });
});
