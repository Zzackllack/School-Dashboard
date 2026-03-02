import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  getDisplay,
  revokeDisplaySession,
  updateDisplay,
} from "../lib/api/displays";
import { getAdminApiToken, setAdminApiToken } from "../lib/display-session";

export const Route = createFileRoute("/admin/displays/$displayId")({
  component: AdminDisplayDetailPage,
});

function AdminDisplayDetailPage() {
  const { displayId } = Route.useParams();
  const [adminToken, setToken] = useState(() => getAdminApiToken() ?? "");
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    locationLabel: "",
    assignedProfileId: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "REVOKED",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    setAdminApiToken(adminToken);
  }, [adminToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadDisplay() {
      if (!adminToken) {
        return;
      }

      try {
        const display = await getDisplay(adminToken, displayId);
        if (!cancelled) {
          setFormState({
            name: display.name,
            slug: display.slug,
            locationLabel: display.locationLabel ?? "",
            assignedProfileId: display.assignedProfileId ?? "",
            status: display.status,
          });
          setStatusMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Display konnte nicht geladen werden.",
          );
        }
      }
    }

    void loadDisplay();

    return () => {
      cancelled = true;
    };
  }, [adminToken, displayId]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminToken) {
      setStatusMessage("Bitte zuerst einen Admin API Token eintragen.");
      return;
    }

    try {
      const response = await updateDisplay(adminToken, displayId, formState);
      setFormState({
        name: response.name,
        slug: response.slug,
        locationLabel: response.locationLabel ?? "",
        assignedProfileId: response.assignedProfileId ?? "",
        status: response.status,
      });
      setStatusMessage("Display erfolgreich aktualisiert.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Display-Update fehlgeschlagen.",
      );
    }
  }

  async function handleRevoke() {
    if (!adminToken) {
      setStatusMessage("Bitte zuerst einen Admin API Token eintragen.");
      return;
    }

    try {
      const response = await revokeDisplaySession(adminToken, displayId);
      setFormState((current) => ({ ...current, status: response.status }));
      setStatusMessage("Display-Session wurde widerrufen.");
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Session-Revoke fehlgeschlagen.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">Display Detail</h1>
        <p className="mt-2 font-mono text-xs text-slate-500">ID: {displayId}</p>

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Admin API Token
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            value={adminToken}
            onChange={(event) => setToken(event.target.value)}
            placeholder="X-Admin-Token"
            autoComplete="off"
          />
        </label>

        <form className="mt-6 space-y-4" onSubmit={handleUpdate}>
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Slug
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.slug}
              onChange={(event) =>
                setFormState((current) => ({ ...current, slug: event.target.value }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Standort
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.locationLabel}
              onChange={(event) =>
                setFormState((current) => ({ ...current, locationLabel: event.target.value }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Profil
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.assignedProfileId}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  assignedProfileId: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.status}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  status: event.target.value as "ACTIVE" | "INACTIVE" | "REVOKED",
                }))
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="REVOKED">REVOKED</option>
            </select>
          </label>

          <div className="flex gap-3">
            <button
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Änderungen speichern
            </button>
            <button
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              type="button"
              onClick={() => void handleRevoke()}
            >
              Session widerrufen
            </button>
          </div>
        </form>

        {statusMessage ? (
          <p className="mt-4 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">
            {statusMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
