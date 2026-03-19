import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DisplayPage } from "#/components/display/DisplayPage";
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

type DisplayAccessResult =
  | { kind: "allow"; displayId: string; themeId: string | null }
  | { kind: "redirect-setup" }
  | { kind: "redirect-display"; displayId: string };

export async function resolveDisplayAccess(
  requestedDisplayId: string,
): Promise<DisplayAccessResult> {
  try {
    const sessionValidation = await validateDisplaySession();
    if (!sessionValidation.valid || !sessionValidation.displayId) {
      clearDisplaySessionStorage();
      return { kind: "redirect-setup" };
    }

    setDisplayIdHint(sessionValidation.displayId);
    if (sessionValidation.displayId !== requestedDisplayId) {
      return {
        kind: "redirect-display",
        displayId: sessionValidation.displayId,
      };
    }

    return {
      kind: "allow",
      displayId: sessionValidation.displayId,
      themeId: sessionValidation.themeId,
    };
  } catch {
    const hintedDisplayId = getDisplayIdHint();
    if (!hintedDisplayId) {
      throw new Error("Display session validation unavailable");
    }

    if (hintedDisplayId !== requestedDisplayId) {
      return { kind: "redirect-display", displayId: hintedDisplayId };
    }

    return {
      kind: "allow",
      displayId: hintedDisplayId,
      themeId: null,
    };
  }
}

function GuardedDisplayRoute() {
  const navigate = useNavigate();
  const { displayId } = Route.useParams();
  const [grantedDisplayId, setGrantedDisplayId] = useState<string | null>(null);
  const [resolvedThemeId, setResolvedThemeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Bitte einen Moment warten.",
  );
  const accessAllowed = grantedDisplayId === displayId;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const retryScope = `display-access:${displayId}`;

    async function guardDisplayAccess() {
      const retryDelayMs = getSessionRetryDelayMs(retryScope);
      if (retryDelayMs > 0) {
        setStatusMessage(
          `Display-Zugriff wird erneut geprüft in ${formatRetryDelay(retryDelayMs)}.`,
        );
        timer = setTimeout(() => {
          if (!cancelled) {
            void guardDisplayAccess();
          }
        }, retryDelayMs);
        return;
      }

      setStatusMessage("Bitte einen Moment warten.");

      try {
        const access = await resolveDisplayAccess(displayId);
        if (cancelled) {
          return;
        }

        clearSessionRetryState(retryScope);

        if (access.kind === "allow") {
          setResolvedThemeId(access.themeId);
          setGrantedDisplayId(access.displayId);
          return;
        }

        if (access.kind === "redirect-display") {
          await navigate({
            to: "/display/$displayId",
            params: { displayId: access.displayId },
            replace: true,
          });
          return;
        }

        await navigate({ to: "/setup", replace: true });
      } catch {
        if (cancelled) {
          return;
        }

        const nextDelayMs = recordSessionRetryFailure(retryScope);
        setStatusMessage(
          `Display-Session kann aktuell nicht geprüft werden. Neuer Versuch in ${formatRetryDelay(nextDelayMs)}.`,
        );
        timer = setTimeout(() => {
          if (!cancelled) {
            void guardDisplayAccess();
          }
        }, nextDelayMs);
      }
    }

    void guardDisplayAccess();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [displayId, navigate]);

  if (!accessAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Display Zugriff wird geprüft</h1>
          <p className="mt-3 text-slate-600">{statusMessage}</p>
        </section>
      </main>
    );
  }

  return <DisplayPage themeId={resolvedThemeId} />;
}

export const Route = createFileRoute("/display/$displayId")({
  component: GuardedDisplayRoute,
});
