// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDisplaySessionStorage,
  getAdminApiToken,
  getDisplayIdHint,
  getDisplaySessionToken,
  getPendingEnrollmentRequestId,
  setAdminApiToken,
  setDisplayIdHint,
  setDisplaySessionToken,
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
    setAdminApiToken(null);
  });

  it("stores and clears display session values", () => {
    setDisplaySessionToken("token-123");
    setDisplayIdHint("display-1");
    setPendingEnrollmentRequestId("request-1");

    expect(getDisplaySessionToken()).toBe("token-123");
    expect(getDisplayIdHint()).toBe("display-1");
    expect(getPendingEnrollmentRequestId()).toBe("request-1");

    clearDisplaySessionStorage();

    expect(getDisplaySessionToken()).toBeNull();
    expect(getDisplayIdHint()).toBeNull();
    expect(getPendingEnrollmentRequestId()).toBeNull();
  });

  it("stores admin api token independently", () => {
    setAdminApiToken("admin-token");
    expect(getAdminApiToken()).toBe("admin-token");

    setAdminApiToken(null);
    expect(getAdminApiToken()).toBeNull();
  });
});
