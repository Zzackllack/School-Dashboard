import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  adminLogout,
  createEnrollmentCode,
  getAdminAuthStatus,
  listDisplays,
  updateAdminCredentials,
} from "../lib/api/displays";

export const Route = createFileRoute("/admin/displays/")({
  component: AdminDisplaysPage,
});

function AdminDisplaysPage() {
  const [ttlSeconds, setTtlSeconds] = useState<number | null>(900);
  const [maxUses, setMaxUses] = useState<number | null>(5);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [displayStatusMessage, setDisplayStatusMessage] = useState<
    string | null
  >(null);
  const [credentialMessage, setCredentialMessage] = useState<string | null>(
    null,
  );
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isCredentialSubmitting, setIsCredentialSubmitting] = useState(false);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [isLoadingDisplays, setIsLoadingDisplays] = useState(true);
  const [displays, setDisplays] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      locationLabel: string | null;
    }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function loadDisplays() {
      setIsLoadingDisplays(true);
      try {
        const [response, authStatus] = await Promise.all([
          listDisplays(),
          getAdminAuthStatus(),
        ]);
        if (!cancelled) {
          setDisplays(response);
          setCurrentUsername(authStatus.username ?? "");
          setDisplayStatusMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setDisplayStatusMessage(
            error instanceof Error
              ? error.message
              : "Displays konnten nicht geladen werden.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDisplays(false);
        }
      }
    }

    void loadDisplays();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCodeCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingCode) {
      return;
    }
    setStatusMessage(null);
    setCreatedCode(null);
    if (
      ttlSeconds === null ||
      maxUses === null ||
      !Number.isInteger(ttlSeconds) ||
      !Number.isInteger(maxUses) ||
      ttlSeconds <= 0 ||
      maxUses <= 0
    ) {
      setStatusMessage(
        "TTL und Max Uses müssen positive ganze Zahlen größer als 0 sein.",
      );
      return;
    }

    setIsCreatingCode(true);
    try {
      const response = await createEnrollmentCode({
        ttlSeconds,
        maxUses,
      });
      setCreatedCode(response.code);
      setStatusMessage(
        `Code erstellt (gültig bis ${new Date(response.expiresAt).toLocaleString("de-DE")}).`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Enrollment-Code konnte nicht erstellt werden.",
      );
    } finally {
      setIsCreatingCode(false);
    }
  }

  async function handleCredentialUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCredentialMessage(null);
    setCredentialError(null);
    if (newUsername.trim().length === 0 && newPassword.trim().length === 0) {
      setCredentialError(
        "Bitte neuen Benutzernamen oder ein neues Passwort eingeben.",
      );
      return;
    }
    setIsCredentialSubmitting(true);

    try {
      const response = await updateAdminCredentials({
        currentPassword,
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });

      setCurrentUsername(response.username ?? "");
      setNewUsername("");
      setCurrentPassword("");
      setNewPassword("");
      setCredentialMessage("Zugangsdaten erfolgreich aktualisiert.");
    } catch (error) {
      setCredentialError(
        error instanceof Error
          ? error.message
          : "Zugangsdaten konnten nicht aktualisiert werden.",
      );
    } finally {
      setIsCredentialSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      // ignore and continue to login page
    }
    window.location.href = "/admin/login";
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="mx-auto max-w-4xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="text-3xl font-bold">Display Administration</h1>
          <p className="mt-2 text-sm text-slate-600">
            Verwalte Enrollment-Codes, ausstehende Freigaben und aktive
            Displays.
          </p>
          <div className="mt-4 flex gap-3 text-sm">
            <Link
              className="rounded-md bg-slate-900 px-3 py-2 font-semibold text-white"
              to="/admin/displays/pending"
            >
              Offene Requests
            </Link>
            <button
              className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-700"
              type="button"
              onClick={() => void handleLogout()}
            >
              Abmelden
            </button>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Admin-Zugangsdaten</h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-2"
            onSubmit={handleCredentialUpdate}
          >
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Aktueller Benutzername
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-600"
                value={currentUsername}
                readOnly
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Neuer Benutzername
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={newUsername}
                onChange={(event) => setNewUsername(event.target.value)}
                placeholder="Optional"
                autoComplete="username"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Neues Passwort
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                placeholder="Optional"
                autoComplete="new-password"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Aktuelles Passwort (Bestätigung)
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isCredentialSubmitting}
              >
                Zugangsdaten aktualisieren
              </button>
            </div>
          </form>

          {credentialMessage ? (
            <p className="mt-3 text-sm text-emerald-700">{credentialMessage}</p>
          ) : null}
          {credentialError ? (
            <p className="mt-3 text-sm text-rose-700">{credentialError}</p>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Enrollment Code erstellen</h2>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-3"
            onSubmit={handleCodeCreate}
          >
            <label className="text-sm font-semibold text-slate-700">
              TTL (Sekunden)
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                type="number"
                min={1}
                step={1}
                value={ttlSeconds ?? ""}
                onChange={(event) => {
                  const { valueAsNumber } = event.currentTarget;
                  if (
                    Number.isFinite(valueAsNumber) &&
                    Number.isInteger(valueAsNumber)
                  ) {
                    setTtlSeconds(valueAsNumber);
                    return;
                  }
                  setTtlSeconds(null);
                }}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Max Uses
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                type="number"
                min={1}
                step={1}
                value={maxUses ?? ""}
                onChange={(event) => {
                  const { valueAsNumber } = event.currentTarget;
                  if (
                    Number.isFinite(valueAsNumber) &&
                    Number.isInteger(valueAsNumber)
                  ) {
                    setMaxUses(valueAsNumber);
                    return;
                  }
                  setMaxUses(null);
                }}
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={isCreatingCode}
              >
                {isCreatingCode ? "Wird erstellt..." : "Code erstellen"}
              </button>
            </div>
          </form>

          {createdCode ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-mono text-emerald-800">
              Neuer Code: {createdCode}
            </p>
          ) : null}
          {statusMessage ? (
            <p className="mt-3 text-sm text-slate-600">{statusMessage}</p>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Bekannte Displays</h2>
          {isLoadingDisplays ? (
            <p className="mt-3 text-sm text-slate-600">Lade Displays...</p>
          ) : displayStatusMessage ? (
            <p className="mt-3 text-sm text-rose-700">{displayStatusMessage}</p>
          ) : displays.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">
              Keine Displays vorhanden.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {displays.map((display) => (
                <li
                  key={display.id}
                  className="rounded-lg border border-slate-200 px-4 py-3"
                >
                  <p className="font-semibold">{display.name}</p>
                  <p className="text-sm text-slate-600">
                    Status: {display.status} | Standort:{" "}
                    {display.locationLabel ?? "-"}
                  </p>
                  <Link
                    className="mt-2 inline-flex text-sm font-semibold text-slate-800 underline"
                    to="/admin/displays/$displayId"
                    params={{ displayId: display.id }}
                  >
                    Details öffnen
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
