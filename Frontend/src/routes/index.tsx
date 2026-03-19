import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { validateDisplaySession } from "#/lib/api/displays";
import {
  clearSessionRetryState,
  formatRetryDelay,
  getSessionRetryDelayMs,
  recordSessionRetryFailure,
} from "#/lib/client-backoff";
import {
  clearDisplaySessionStorage,
  getDisplayIdHint,
  setDisplayIdHint,
} from "#/lib/display-session";

export interface BootstrapRedirectTarget {
  to: "/setup" | "/display/$displayId";
  displayId?: string;
}

const BOOTSTRAP_RETRY_SCOPE = "bootstrap-session";

export async function resolveBootstrapRedirect(): Promise<BootstrapRedirectTarget> {
  try {
    const sessionValidation = await validateDisplaySession();
    if (sessionValidation.valid && sessionValidation.displayId) {
      setDisplayIdHint(sessionValidation.displayId);
      return {
        to: "/display/$displayId",
        displayId: sessionValidation.displayId,
      };
    }
  } catch {
    const hintedDisplayId = getDisplayIdHint();
    if (hintedDisplayId) {
      return {
        to: "/display/$displayId",
        displayId: hintedDisplayId,
      };
    }

    throw new Error("Display session validation unavailable");
  }

  clearDisplaySessionStorage();
  return { to: "/setup" };
}

export function BootstrapResolverPage() {
  const navigate = useNavigate();
  const [message, setMessage] = useState(
    "Display session wird geprüft. Bitte einen Moment warten.",
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function resolveBootstrap() {
      const retryDelayMs = getSessionRetryDelayMs(BOOTSTRAP_RETRY_SCOPE);
      if (retryDelayMs > 0) {
        setMessage(
          `Display-Session kann aktuell nicht geprüft werden. Neuer Versuch in ${formatRetryDelay(retryDelayMs)}.`,
        );
        timer = setTimeout(() => {
          if (!cancelled) {
            void resolveBootstrap();
          }
        }, retryDelayMs);
        return;
      }

      try {
        const redirectTarget = await resolveBootstrapRedirect();

        if (cancelled) {
          return;
        }

        clearSessionRetryState(BOOTSTRAP_RETRY_SCOPE);

        if (
          redirectTarget.to === "/display/$displayId" &&
          redirectTarget.displayId
        ) {
          await navigate({
            to: "/display/$displayId",
            params: { displayId: redirectTarget.displayId },
            replace: true,
          });
          return;
        }

        await navigate({ to: "/setup", replace: true });
        return;
      } catch {
        if (cancelled) {
          return;
        }

        const nextDelayMs = recordSessionRetryFailure(BOOTSTRAP_RETRY_SCOPE);
        setMessage(
          `Display-Session kann aktuell nicht geprüft werden. Neuer Versuch in ${formatRetryDelay(nextDelayMs)}.`,
        );
        timer = setTimeout(() => {
          if (!cancelled) {
            void resolveBootstrap();
          }
        }, nextDelayMs);
      }
    }

    void resolveBootstrap();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold">Display Start</h1>
        <p className="mt-3 text-slate-600">{message}</p>
      </section>
    </main>
  );
}

export const Route = createFileRoute("/")({
  component: BootstrapResolverPage,
});
