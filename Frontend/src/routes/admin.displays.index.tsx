import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createEnrollmentCode, listDisplays } from "../lib/api/displays";
import { getAdminApiToken, setAdminApiToken } from "../lib/display-session";

export const Route = createFileRoute("/admin/displays/")({
  component: AdminDisplaysPage,
});

function AdminDisplaysPage() {
  const [adminToken, setToken] = useState(() => getAdminApiToken() ?? "");
  const [ttlSeconds, setTtlSeconds] = useState("900");
  const [maxUses, setMaxUses] = useState("5");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [displays, setDisplays] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      locationLabel: string | null;
    }>
  >([]);

  useEffect(() => {
    setAdminApiToken(adminToken);
  }, [adminToken]);

  useEffect(() => {
    let cancelled = false;

    async function loadDisplays() {
      if (!adminToken) {
        setDisplays([]);
        return;
      }

      try {
        const response = await listDisplays(adminToken);
        if (!cancelled) {
          setDisplays(response);
        }
      } catch (error) {
        if (!cancelled) {
          setStatusMessage(
            error instanceof Error
              ? error.message
              : "Displays konnten nicht geladen werden.",
          );
        }
      }
    }

    void loadDisplays();

    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  async function handleCodeCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatusMessage(null);
    setCreatedCode(null);

    if (!adminToken) {
      setStatusMessage("Bitte zuerst einen Admin API Token eintragen.");
      return;
    }

    try {
      const response = await createEnrollmentCode(adminToken, {
        ttlSeconds: Number(ttlSeconds),
        maxUses: Number(maxUses),
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
    }
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
          <div className="mt-4 flex gap-3 text-sm">
            <Link
              className="rounded-md bg-slate-900 px-3 py-2 font-semibold text-white"
              to="/admin/displays/pending"
            >
              Offene Requests
            </Link>
          </div>
        </header>

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
                value={ttlSeconds}
                onChange={(event) => setTtlSeconds(event.target.value)}
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Max Uses
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
              />
            </label>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Code erstellen
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
          {displays.length === 0 ? (
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
