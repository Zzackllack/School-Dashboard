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
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key: string, value: string | null) {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  if (value === null || value.trim().length === 0) {
    if (typeof storage.removeItem === "function") {
      try {
        storage.removeItem(key);
      } catch {
        // ignore storage write failures
      }
    } else if (typeof storage.setItem === "function") {
      try {
        storage.setItem(key, "");
      } catch {
        // ignore storage write failures
      }
    }
    return;
  }
  if (typeof storage.setItem === "function") {
    try {
      storage.setItem(key, value.trim());
    } catch {
      // ignore storage write failures
    }
  }
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
  setDisplayIdHint(null);
  setPendingEnrollmentRequestId(null);
}
