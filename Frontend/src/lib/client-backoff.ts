interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistentBackoffState {
  failureCount: number;
  nextAllowedAt: number;
}

interface PendingPollState {
  firstSeenAt: number;
  consecutiveErrorCount: number;
}

const DISPLAY_BACKOFF_PREFIX = "display-retry:";
const PENDING_POLL_PREFIX = "pending-poll:";
const DEFAULT_SESSION_BACKOFF_BASE_MS = 30_000;
const DEFAULT_SESSION_BACKOFF_MAX_MS = 15 * 60_000;
const DEFAULT_PENDING_ERROR_BASE_MS = 15_000;
const DEFAULT_PENDING_ERROR_MAX_MS = 5 * 60_000;

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const candidate = window.localStorage;
    if (
      typeof candidate?.getItem === "function" &&
      typeof candidate?.setItem === "function" &&
      typeof candidate?.removeItem === "function"
    ) {
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

function readJson<T>(key: string, storage?: StorageLike): T | null {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) {
    return null;
  }

  const raw = resolvedStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    resolvedStorage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown, storage?: StorageLike) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  resolvedStorage.setItem(key, JSON.stringify(value));
}

function removeKey(key: string, storage?: StorageLike) {
  const resolvedStorage = resolveStorage(storage);
  if (!resolvedStorage) {
    return;
  }

  resolvedStorage.removeItem(key);
}

function buildDisplayBackoffKey(scope: string) {
  return `${DISPLAY_BACKOFF_PREFIX}${scope}`;
}

function buildPendingPollKey(requestId: string) {
  return `${PENDING_POLL_PREFIX}${requestId}`;
}

export function formatRetryDelay(delayMs: number): string {
  const totalSeconds = Math.max(1, Math.ceil(delayMs / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;
}

export function getSessionRetryDelayMs(
  scope: string,
  options?: {
    storage?: StorageLike;
    now?: number;
  },
): number {
  const now = options?.now ?? Date.now();
  const state = readJson<PersistentBackoffState>(
    buildDisplayBackoffKey(scope),
    options?.storage,
  );
  if (!state) {
    return 0;
  }

  return Math.max(0, state.nextAllowedAt - now);
}

export function recordSessionRetryFailure(
  scope: string,
  options?: {
    storage?: StorageLike;
    now?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  },
): number {
  const now = options?.now ?? Date.now();
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_SESSION_BACKOFF_BASE_MS;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_SESSION_BACKOFF_MAX_MS;
  const key = buildDisplayBackoffKey(scope);
  const previous =
    readJson<PersistentBackoffState>(key, options?.storage) ?? null;
  const failureCount = Math.min((previous?.failureCount ?? 0) + 1, 10);
  const delayMs = Math.min(maxDelayMs, baseDelayMs * 2 ** (failureCount - 1));

  writeJson(
    key,
    {
      failureCount,
      nextAllowedAt: now + delayMs,
    } satisfies PersistentBackoffState,
    options?.storage,
  );

  return delayMs;
}

export function clearSessionRetryState(
  scope: string,
  options?: { storage?: StorageLike },
) {
  removeKey(buildDisplayBackoffKey(scope), options?.storage);
}

function readPendingPollState(
  requestId: string,
  storage?: StorageLike,
): PendingPollState | null {
  return readJson<PendingPollState>(buildPendingPollKey(requestId), storage);
}

function writePendingPollState(
  requestId: string,
  state: PendingPollState,
  storage?: StorageLike,
) {
  writeJson(buildPendingPollKey(requestId), state, storage);
}

export function getPendingPollDelayMs(
  requestId: string,
  pollAfterSeconds: number | null | undefined,
  options?: {
    storage?: StorageLike;
    now?: number;
  },
): number {
  const now = options?.now ?? Date.now();
  const existingState =
    readPendingPollState(requestId, options?.storage) ??
    ({
      firstSeenAt: now,
      consecutiveErrorCount: 0,
    } satisfies PendingPollState);

  writePendingPollState(requestId, existingState, options?.storage);

  const elapsedMs = Math.max(0, now - existingState.firstSeenAt);
  const serverDelayMs = Math.min(
    60_000,
    Math.max(1_000, Math.round((pollAfterSeconds ?? 5) * 1000)),
  );

  let clientMinimumDelayMs = 5_000;
  if (elapsedMs >= 15 * 60_000) {
    clientMinimumDelayMs = 60_000;
  } else if (elapsedMs >= 5 * 60_000) {
    clientMinimumDelayMs = 30_000;
  } else if (elapsedMs >= 60_000) {
    clientMinimumDelayMs = 15_000;
  }

  if (existingState.consecutiveErrorCount !== 0) {
    writePendingPollState(
      requestId,
      { ...existingState, consecutiveErrorCount: 0 },
      options?.storage,
    );
  }

  return Math.max(serverDelayMs, clientMinimumDelayMs);
}

export function recordPendingPollError(
  requestId: string,
  options?: {
    storage?: StorageLike;
    now?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  },
): number {
  const now = options?.now ?? Date.now();
  const baseDelayMs = options?.baseDelayMs ?? DEFAULT_PENDING_ERROR_BASE_MS;
  const maxDelayMs = options?.maxDelayMs ?? DEFAULT_PENDING_ERROR_MAX_MS;
  const previousState =
    readPendingPollState(requestId, options?.storage) ??
    ({
      firstSeenAt: now,
      consecutiveErrorCount: 0,
    } satisfies PendingPollState);
  const consecutiveErrorCount = Math.min(
    previousState.consecutiveErrorCount + 1,
    8,
  );
  const delayMs = Math.min(
    maxDelayMs,
    baseDelayMs * 2 ** (consecutiveErrorCount - 1),
  );

  writePendingPollState(
    requestId,
    {
      firstSeenAt: previousState.firstSeenAt,
      consecutiveErrorCount,
    } satisfies PendingPollState,
    options?.storage,
  );

  return delayMs;
}

export function clearPendingPollState(
  requestId: string,
  options?: { storage?: StorageLike },
) {
  removeKey(buildPendingPollKey(requestId), options?.storage);
}
