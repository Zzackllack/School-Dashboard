import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  approveDisplayEnrollment,
  listDisplayEnrollments,
  rejectDisplayEnrollment,
} from "../lib/api/displays";
import { getAdminCredentials } from "../lib/display-session";

export const Route = createFileRoute("/admin/displays/pending")({
  component: AdminPendingDisplaysPage,
});

function AdminPendingDisplaysPage() {
  const [credentials] = useState(() => getAdminCredentials());
  const [pendingRequests, setPendingRequests] = useState<
    Array<{
      requestId: string;
      proposedDisplayName: string;
      createdAt: string;
      expiresAt: string;
    }>
  >([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function refreshPending() {
    if (!credentials) {
      setPendingRequests([]);
      return;
    }

    try {
      const response = await listDisplayEnrollments(credentials, "PENDING");
      setPendingRequests(response);
      setStatusMessage(null);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Pending Requests konnten nicht geladen werden.",
      );
    }
  }

  useEffect(() => {
    void refreshPending();
  }, [credentials]);

  async function approve(requestId: string) {
    try {
      if (!credentials) {
        setStatusMessage("Admin-Anmeldung fehlt.");
        return;
      }
      await approveDisplayEnrollment(credentials, requestId, {});
      setStatusMessage(`Request ${requestId} freigegeben.`);
      await refreshPending();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Freigabe fehlgeschlagen.",
      );
    }
  }

  async function reject(requestId: string) {
    try {
      if (!credentials) {
        setStatusMessage("Admin-Anmeldung fehlt.");
        return;
      }
      await rejectDisplayEnrollment(credentials, requestId, {
        reason: "Rejected by admin",
      });
      setStatusMessage(`Request ${requestId} abgelehnt.`);
      await refreshPending();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Ablehnung fehlgeschlagen.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">Pending Display Requests</h1>
        <p className="mt-2 text-sm text-slate-600">
          Freigabe oder Ablehnung für neue Display-Enrollments.
        </p>

        {statusMessage ? (
          <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {statusMessage}
          </p>
        ) : null}

        {pendingRequests.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">Keine offenen Requests.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {pendingRequests.map((request) => (
              <li
                key={request.requestId}
                className="rounded-lg border border-slate-200 p-4"
              >
                <p className="font-semibold">{request.proposedDisplayName}</p>
                <p className="text-xs text-slate-500">
                  ID: {request.requestId}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Erstellt:{" "}
                  {new Date(request.createdAt).toLocaleString("de-DE")} | Läuft
                  ab: {new Date(request.expiresAt).toLocaleString("de-DE")}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
                    onClick={() => void approve(request.requestId)}
                    type="button"
                  >
                    Freigeben
                  </button>
                  <button
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white"
                    onClick={() => void reject(request.requestId)}
                    type="button"
                  >
                    Ablehnen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
