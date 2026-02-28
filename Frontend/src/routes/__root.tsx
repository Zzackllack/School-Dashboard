import type { QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  ssr: false,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "School Dashboard",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootErrorComponent({ error }: { error: unknown }) {
  const errorMessage =
    error instanceof Error ? error.message : "Unknown route error";
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error("[router] route-level failure", {
    message: errorMessage,
    stack: errorStack,
  });

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Anwendungsfehler</h1>
        <p className="mt-3 text-gray-700">
          Die Seite konnte nicht geladen werden. Bitte versuche es erneut.
        </p>
      </section>
    </main>
  );
}

function RootNotFoundComponent() {
  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Seite nicht gefunden</h1>
        <p className="mt-3 text-gray-700">
          Diese Route existiert nicht in der aktuellen Dashboard-Anwendung.
        </p>
      </section>
    </main>
  );
}
