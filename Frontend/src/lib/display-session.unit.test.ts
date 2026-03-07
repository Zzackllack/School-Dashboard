// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDisplaySessionStorage,
  getDisplayIdHint,
  getPendingEnrollmentRequestId,
  setDisplayIdHint,
  setPendingEnrollmentRequestId,
} from "./display-session";

describe("display-session storage", () => {
  beforeEach(() => {
    const memoryStore = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem(key: string) {
          return memoryStore.has(key) ? (memoryStore.get(key) ?? null) : null;
        },
        setItem(key: string, value: string) {
          memoryStore.set(key, value);
        },
        removeItem(key: string) {
          memoryStore.delete(key);
        },
      },
    });

    clearDisplaySessionStorage();
  });

  it("stores and clears display session values", () => {
    setDisplayIdHint("display-1");
    setPendingEnrollmentRequestId("request-1");

    expect(getDisplayIdHint()).toBe("display-1");
    expect(getPendingEnrollmentRequestId()).toBe("request-1");

    clearDisplaySessionStorage();

    expect(getDisplayIdHint()).toBeNull();
    expect(getPendingEnrollmentRequestId()).toBeNull();
  });
});
