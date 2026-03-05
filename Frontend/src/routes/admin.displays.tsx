import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminAuthStatus } from "../lib/api/displays";

function AdminDisplaysLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      try {
        const authStatus = await getAdminAuthStatus();
        if (cancelled) {
          return;
        }
        if (!authStatus.authenticated) {
          if (cancelled) {
            return;
          }
          await navigate({ to: "/admin/login", replace: true });
          return;
        }

        setReady(true);
      } catch {
        if (cancelled) {
          return;
        }
        await navigate({ to: "/admin/login", replace: true });
      }
    }

    void verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold">Admin Zugriff wird geprüft</h1>
          <p className="mt-3 text-slate-600">Bitte einen Moment warten.</p>
        </section>
      </main>
    );
  }

  return <Outlet />;
}

export const Route = createFileRoute("/admin/displays")({
  component: AdminDisplaysLayout,
});
