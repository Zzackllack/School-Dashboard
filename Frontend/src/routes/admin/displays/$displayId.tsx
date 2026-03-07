import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  deleteDisplay,
  getDisplay,
  revokeDisplaySession,
  updateDisplay,
} from "#/lib/api/displays";
import { DISPLAY_THEME_CATALOG } from "#/components/display/themes/catalog";

export const Route = createFileRoute("/admin/displays/$displayId")({
  component: AdminDisplayDetailPage,
});

export function AdminDisplayDetailPage() {
  const navigate = useNavigate();
  const { displayId } = Route.useParams();
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    locationLabel: "",
    assignedProfileId: "",
    themeId: "default",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "REVOKED",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "neutral">(
    "neutral",
  );
  const [isDisplayLoaded, setIsDisplayLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsDisplayLoaded(false);

    async function loadDisplay() {
      try {
        const display = await getDisplay(displayId);
        if (!cancelled) {
          setFormState({
            name: display.name,
            slug: display.slug,
            locationLabel: display.locationLabel ?? "",
            assignedProfileId: display.assignedProfileId ?? "",
            themeId: display.themeId,
            status: display.status,
          });
          setIsDisplayLoaded(true);
          setStatusMessage(null);
          setStatusType("neutral");
        }
      } catch (error) {
        if (!cancelled) {
          setIsDisplayLoaded(false);
          setStatusType("error");
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
  }, [displayId]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isDisplayLoaded) {
      return;
    }

    try {
      const response = await updateDisplay(displayId, formState);
      setFormState({
        name: response.name,
        slug: response.slug,
        locationLabel: response.locationLabel ?? "",
        assignedProfileId: response.assignedProfileId ?? "",
        themeId: response.themeId,
        status: response.status,
      });
      setStatusType("success");
      setStatusMessage("Display erfolgreich aktualisiert.");
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Display-Update fehlgeschlagen.",
      );
    }
  }

  async function handleRevoke() {
    if (!isDisplayLoaded) {
      return;
    }
    const confirmed = window.confirm(
      "Session wirklich widerrufen? Das Display muss sich danach neu authentifizieren.",
    );
    if (!confirmed) {
      return;
    }
    try {
      const response = await revokeDisplaySession(displayId);
      setFormState((current) => ({ ...current, status: response.status }));
      setStatusType("success");
      setStatusMessage("Display-Session wurde widerrufen.");
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Session-Revoke fehlgeschlagen.",
      );
    }
  }

  async function handleDelete() {
    if (!isDisplayLoaded) {
      return;
    }
    const confirmed = window.confirm(
      "Display wirklich löschen? Dieser Schritt kann nicht rückgängig gemacht werden.",
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteDisplay(displayId);
      await navigate({ to: "/admin/displays", replace: true });
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Display-Löschung fehlgeschlagen.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold">Display Detail</h1>
        <p className="mt-2 font-mono text-xs text-slate-500">ID: {displayId}</p>

        <form className="mt-6 space-y-4" onSubmit={handleUpdate}>
          <label className="block text-sm font-semibold text-slate-700">
            Name
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.name}
              disabled={!isDisplayLoaded}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Slug
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.slug}
              disabled={!isDisplayLoaded}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  slug: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Standort
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.locationLabel}
              disabled={!isDisplayLoaded}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  locationLabel: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Profil
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.assignedProfileId}
              disabled={!isDisplayLoaded}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  assignedProfileId: event.target.value,
                }))
              }
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Theme
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.themeId}
              disabled={!isDisplayLoaded}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  themeId: event.target.value,
                }))
              }
            >
              {DISPLAY_THEME_CATALOG.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Status
            <select
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              value={formState.status}
              disabled={!isDisplayLoaded}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  status: event.target.value as
                    | "ACTIVE"
                    | "INACTIVE"
                    | "REVOKED",
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
              disabled={!isDisplayLoaded}
              type="submit"
            >
              Änderungen speichern
            </button>
            <button
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
              disabled={!isDisplayLoaded}
              type="button"
              onClick={() => void handleRevoke()}
            >
              Session widerrufen
            </button>
            <button
              className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold text-white"
              disabled={!isDisplayLoaded}
              type="button"
              onClick={() => void handleDelete()}
            >
              Display löschen
            </button>
          </div>
        </form>

        {statusMessage ? (
          <p
            className={`mt-4 rounded-md px-3 py-2 text-sm ${
              statusType === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                : statusType === "error"
                  ? "border border-rose-200 bg-rose-50 text-rose-700"
                  : "bg-slate-100 text-slate-700"
            }`}
          >
            {statusMessage}
          </p>
        ) : null}
      </section>
    </main>
  );
}
