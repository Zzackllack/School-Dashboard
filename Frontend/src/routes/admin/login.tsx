import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { adminLogin, getAdminAuthStatus } from "#/lib/api/displays";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPasswordValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const authStatus = await getAdminAuthStatus();
      if (!cancelled && authStatus.authenticated) {
        await navigate({ to: "/admin/displays", replace: true });
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const authStatus = await adminLogin(username, password);
      if (!authStatus.authenticated) {
        setErrorMessage("Admin-Anmeldung fehlgeschlagen.");
        return;
      }

      await navigate({ to: "/admin/displays", replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Admin-Anmeldung fehlgeschlagen.",
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
          Zugriff nur mit Admin-Benutzername und Passwort.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Benutzername
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              required
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Passwort
            </span>
            <input
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
              value={password}
              onChange={(event) => setPasswordValue(event.target.value)}
              placeholder="Passwort"
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
