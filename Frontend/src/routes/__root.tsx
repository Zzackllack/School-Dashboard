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
        title: "Schul Dashboard | Goethe Gymnasium Lichterfelde",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
      {
        name: "title",
        content: "Schul Dashboard | Goethe Gymnasium Lichterfelde",
      },
      {
        name: "description",
        content:
          "Vertretungsplan, Wetter, Verkehrsinformationen und Schulkalender für das Goethe Gymnasium Lichterfelde",
      },
      {
        name: "author",
        content: "Cédric und Informatik Leistungskurs",
      },
      {
        name: "theme-color",
        content: "#3E3128",
      },
      {
        name: "application-name",
        content: "Schul Dashboard GGL",
      },
      {
        name: "generator",
        content: "Vite",
      },
      {
        name: "keywords",
        content:
          "Schul Dashboard, Goethe Gymnasium Lichterfelde, GGL, Vertretungsplan, Berlin, Schule",
      },
      {
        httpEquiv: "Cache-Control",
        content: "no-cache, no-store, must-revalidate",
      },
      {
        httpEquiv: "Pragma",
        content: "no-cache",
      },
      {
        httpEquiv: "Expires",
        content: "0",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:locale",
        content: "de_DE",
      },
      {
        property: "og:url",
        content: "https://dashboard.goethe-gymnasium-lichterfelde.de/",
      },
      {
        property: "og:title",
        content: "Schul Dashboard | Goethe Gymnasium Lichterfelde",
      },
      {
        property: "og:description",
        content:
          "Vertretungsplan, Wetter, Verkehrsinformationen und Schulkalender für das Goethe Gymnasium Lichterfelde",
      },
      {
        property: "og:image",
        content: "/favicon/web-app-manifest-512x512.png",
      },
      {
        property: "og:image:alt",
        content: "Goethe Gymnasium Lichterfelde Logo",
      },
      {
        property: "og:site_name",
        content: "Schul Dashboard GGL",
      },
      {
        property: "twitter:card",
        content: "summary_large_image",
      },
      {
        property: "twitter:url",
        content: "https://dashboard.goethe-gymnasium-lichterfelde.de/",
      },
      {
        property: "twitter:title",
        content: "Schul Dashboard | Goethe Gymnasium Lichterfelde",
      },
      {
        property: "twitter:description",
        content:
          "Vertretungsplan, Wetter, Verkehrsinformationen und Schulkalender für das Goethe Gymnasium Lichterfelde",
      },
      {
        property: "twitter:image",
        content: "/favicon/web-app-manifest-512x512.png",
      },
      {
        property: "twitter:image:alt",
        content: "Goethe Gymnasium Lichterfelde Logo",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Schul Dashboard GGL",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "format-detection",
        content: "telephone=no",
      },
      {
        name: "msapplication-TileColor",
        content: "#3E3128",
      },
      {
        name: "msapplication-config",
        content: "/favicon/browserconfig.xml",
      },
      {
        name: "application-name",
        content: "GGL Dashboard",
      },
      {
        name: "HandheldFriendly",
        content: "true",
      },
      {
        name: "MobileOptimized",
        content: "width",
      },
      {
        name: "geo.region",
        content: "DE-BE",
      },
      {
        name: "geo.placename",
        content: "Berlin",
      },
      {
        name: "geo.position",
        content: "52.43432378391319;13.305375391277634",
      },
      {
        name: "ICBM",
        content: "52.43432378391319, 13.305375391277634",
      },
      {
        name: "DC.title",
        content: "Schul Dashboard | Goethe Gymnasium Lichterfelde",
      },
      {
        name: "DC.creator",
        content: "Cédric und Informatik Leistungskurs",
      },
      {
        name: "DC.description",
        content:
          "Vertretungsplan, Wetter, Verkehrsinformationen und Schulkalender für das Goethe Gymnasium Lichterfelde",
      },
      {
        name: "DC.language",
        content: "de",
      },
      {
        name: "DC.publisher",
        content: "Goethe Gymnasium Lichterfelde",
      },
      {
        name: "DC.rights",
        content: "© Goethe Gymnasium Lichterfelde",
      },
      {
        name: "DC.source",
        content: "https://goethe-gymnasium-lichterfelde.de/",
      },
      {
        name: "DC.keywords",
        content: "Schul Dashboard, Goethe Gymnasium Lichterfelde, GGL",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon/favicon-96x96.png",
        sizes: "96x96",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon/favicon.svg",
      },
      {
        rel: "shortcut icon",
        href: "/favicon/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/favicon/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/favicon/site.webmanifest",
      },
      {
        rel: "preconnect",
        href: "https://cloud.umami.is",
      },
      {
        rel: "dns-prefetch",
        href: "//cloud.umami.is",
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
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="02678dcd-988c-454d-82f5-736231784060"
        />
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
