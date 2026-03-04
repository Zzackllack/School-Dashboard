const DISPLAY_SESSION_TOKEN_KEY = "display_session_token";
const DISPLAY_ID_KEY = "display_id";
const DISPLAY_PENDING_REQUEST_ID_KEY = "display_pending_request_id";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function readStorageValue(key: string): string | null {
  const storage = getStorage();
  if (!storage || typeof storage.getItem !== "function") {
    return null;
  }
  return storage.getItem(key);
}

function writeStorageValue(key: string, value: string | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  if (value === null || value.trim().length === 0) {
    if (typeof storage.removeItem === "function") {
      storage.removeItem(key);
    } else if (typeof storage.setItem === "function") {
      storage.setItem(key, "");
    }
    return;
  }
  if (typeof storage.setItem === "function") {
    storage.setItem(key, value.trim());
  }
}

export function getDisplaySessionToken(): string | null {
  return readStorageValue(DISPLAY_SESSION_TOKEN_KEY);
}

export function setDisplaySessionToken(value: string | null) {
  writeStorageValue(DISPLAY_SESSION_TOKEN_KEY, value);
}

export function getDisplayIdHint(): string | null {
  return readStorageValue(DISPLAY_ID_KEY);
}

export function setDisplayIdHint(value: string | null) {
  writeStorageValue(DISPLAY_ID_KEY, value);
}

export function getPendingEnrollmentRequestId(): string | null {
  return readStorageValue(DISPLAY_PENDING_REQUEST_ID_KEY);
}

export function setPendingEnrollmentRequestId(value: string | null) {
  writeStorageValue(DISPLAY_PENDING_REQUEST_ID_KEY, value);
}

export function clearDisplaySessionStorage() {
  setDisplaySessionToken(null);
  setDisplayIdHint(null);
  setPendingEnrollmentRequestId(null);
}
