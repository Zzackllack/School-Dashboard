import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getEnrollmentStatus } from "../lib/api/displays";
import {
  getPendingEnrollmentRequestId,
  setDisplayIdHint,
  setPendingEnrollmentRequestId,
} from "../lib/display-session";

export const Route = createFileRoute("/setup/pending")({
  validateSearch: (search: Record<string, unknown>) => ({
    requestId:
      typeof search.requestId === "string" && search.requestId.length > 0
        ? search.requestId
        : undefined,
  }),
  component: SetupPendingPage,
});

export function SetupPendingPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [status, setStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "UNKNOWN"
  >("PENDING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestId = useMemo(
    () => search.requestId ?? getPendingEnrollmentRequestId(),
    [search.requestId],
  );

  useEffect(() => {
    const activeRequestId = requestId;
    if (!activeRequestId) {
      setStatus("UNKNOWN");
      return;
    }
    const stableRequestId: string = activeRequestId;

    setPendingEnrollmentRequestId(stableRequestId);
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await getEnrollmentStatus(stableRequestId);
        if (cancelled) {
          return;
        }

        setErrorMessage(null);
        setStatus(response.status);

        if (response.status === "APPROVED" && response.displayId) {
          setDisplayIdHint(response.displayId);
          setPendingEnrollmentRequestId(null);

          await navigate({
            to: "/display/$displayId",
            params: { displayId: response.displayId },
            replace: true,
          });
          return;
        }

        if (response.status === "REJECTED" || response.status === "EXPIRED") {
          setPendingEnrollmentRequestId(null);
          return;
        }

        const nextPollDelayMs = (response.pollAfterSeconds ?? 5) * 1000;
        timer = setTimeout(() => {
          void poll();
        }, nextPollDelayMs);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Status konnte nicht geladen werden.",
          );
          timer = setTimeout(() => {
            void poll();
          }, 5000);
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [navigate, requestId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold">Setup ausstehend</h1>
        <p className="mt-3 text-slate-600">
          Diese Anzeige wartet auf Admin-Freigabe.
        </p>

        <dl className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-600">Request ID</dt>
            <dd className="break-all font-mono text-slate-800">
              {requestId ?? "-"}
            </dd>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <dt className="font-semibold text-slate-600">Status</dt>
            <dd className="font-semibold text-slate-900">{status}</dd>
          </div>
        </dl>

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        {status === "REJECTED" ||
        status === "EXPIRED" ||
        status === "UNKNOWN" ? (
          <p className="mt-6 text-sm text-slate-600">
            Bitte starte das Setup erneut unter{" "}
            <Link className="font-semibold underline" to="/setup">
              /setup
            </Link>
            .
          </p>
        ) : null}
      </section>
    </main>
  );
}
