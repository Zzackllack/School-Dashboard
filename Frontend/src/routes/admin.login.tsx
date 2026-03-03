import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { verifyAdminAccess } from "../lib/api/displays";
import {
  clearAdminAuthStorage,
  getAdminCredentials,
  setAdminApiToken,
  setAdminPassword,
} from "../lib/display-session";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState("");
  const [adminPassword, setAdminPasswordValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const credentials = getAdminCredentials();
    if (!credentials) {
      return;
    }
    void navigate({ to: "/admin/displays", replace: true });
  }, [navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const authenticated = await verifyAdminAccess({
        adminToken,
        adminPassword,
      });
      if (!authenticated) {
        setErrorMessage("Admin-Anmeldung fehlgeschlagen.");
        return;
      }

      setAdminApiToken(adminToken);
      setAdminPassword(adminPassword);
      await navigate({ to: "/admin/displays", replace: true });
    } catch (error) {
      clearAdminAuthStorage();
      setErrorMessage(
        error instanceof Error ? error.message : "Admin-Anmeldung fehlgeschlagen.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
      <section className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-bold">Admin Login</h1>
        <p className="mt-3 text-slate-600">
          Zugriff nur mit Admin API Token und PIN/Passwort.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Admin API Token
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-slate-500 focus:outline-none"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="X-Admin-Token"
              required
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Admin PIN / Passwort
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              value={adminPassword}
              onChange={(event) => setAdminPasswordValue(event.target.value)}
              placeholder="X-Admin-Password"
              type="password"
              required
              autoComplete="current-password"
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
            {isSubmitting ? "Prüfe Zugang..." : "Anmelden"}
          </button>
        </form>
      </section>
    </main>
  );
}
