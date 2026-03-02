import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { createEnrollment } from "../lib/api/displays";
import { setPendingEnrollmentRequestId } from "../lib/display-session";

function readDeviceInfo(): Record<string, unknown> | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
  };
}

export function SetupEnrollmentPage() {
  const navigate = useNavigate();
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await createEnrollment({
        enrollmentCode,
        proposedDisplayName: displayName,
        deviceInfo: readDeviceInfo(),
      });

      setPendingEnrollmentRequestId(response.requestId);
      await navigate({
        to: "/setup/pending",
        search: { requestId: response.requestId },
      });
    } catch (error) {
      const fallback = "Enrollment konnte nicht gestartet werden.";
      setErrorMessage(error instanceof Error ? error.message : fallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold">Display Setup</h1>
        <p className="mt-3 text-slate-600">
          Registriere dieses Gerät mit einem Admin-Enroll-Code.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Enrollment Code
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              value={enrollmentCode}
              onChange={(event) => setEnrollmentCode(event.target.value)}
              required
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Display Name
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
              autoComplete="off"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Wird gestartet..." : "Enrollment starten"}
          </button>
        </form>
      </section>
    </main>
  );
}

export const Route = createFileRoute("/setup/")({
  component: SetupEnrollmentPage,
});
