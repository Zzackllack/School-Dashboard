import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/display/$screenId")({
  component: DisplayRoute,
});

function DisplayRoute() {
  const { screenId } = Route.useParams();

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Display Route Placeholder</h1>
        <p className="mt-3 text-gray-700">
          Diese Route ist für zukünftige display-spezifische Konfigurationen
          reserviert.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Angefragte Display-ID: <strong>{screenId}</strong>
        </p>
      </section>
    </main>
  );
}
