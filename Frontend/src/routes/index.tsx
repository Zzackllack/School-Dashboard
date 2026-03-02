import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { validateDisplaySession } from "../lib/api/displays";
import {
  clearDisplaySessionStorage,
  getDisplaySessionToken,
  setDisplayIdHint,
} from "../lib/display-session";

export interface BootstrapRedirectTarget {
  to: "/setup" | "/display/$displayId";
  displayId?: string;
}

export async function resolveBootstrapRedirect(): Promise<BootstrapRedirectTarget> {
  const displaySessionToken = getDisplaySessionToken();
  if (!displaySessionToken) {
    return { to: "/setup" };
  }

  const sessionValidation = await validateDisplaySession(displaySessionToken);
  if (sessionValidation.valid && sessionValidation.displayId) {
    setDisplayIdHint(sessionValidation.displayId);
    return {
      to: "/display/$displayId",
      displayId: sessionValidation.displayId,
    };
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

    async function resolveBootstrap() {
      try {
        const redirectTarget = await resolveBootstrapRedirect();

        if (cancelled) {
          return;
        }

        if (redirectTarget.to === "/display/$displayId" && redirectTarget.displayId) {
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
        // Fall through to setup flow.
      }

      if (cancelled) {
        return;
      }

      clearDisplaySessionStorage();
      setMessage(
        "Display-Session ist ungültig oder abgelaufen. Setup wird geöffnet.",
      );
      clearDisplaySessionStorage();
      await navigate({ to: "/setup", replace: true });
    }

    void resolveBootstrap();

    return () => {
      cancelled = true;
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
