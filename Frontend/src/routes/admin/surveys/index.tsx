import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { getAdminAuthStatus, listDisplays } from "#/lib/api/displays";
import {
  listAdminSurveys,
  type AdminSurveyListItemResponse,
  type SurveyCategory,
} from "#/lib/api/surveys";

const CATEGORY_OPTIONS: Array<{ value: SurveyCategory; label: string }> = [
  { value: "PROBLEM", label: "Problem" },
  { value: "WUNSCH", label: "Wunsch" },
  { value: "ALLGEMEINES_FEEDBACK", label: "Allgemeines Feedback" },
];

export const Route = createFileRoute("/admin/surveys/" as never)({
  beforeLoad: async () => {
    if (typeof window === "undefined") {
      return;
    }
    const authStatus = await getAdminAuthStatus();
    if (!authStatus.authenticated) {
      throw redirect({ to: "/admin/login" as never });
    }
  },
  component: AdminSurveysPage,
});

export function AdminSurveysPage() {
  const [items, setItems] = useState<AdminSurveyListItemResponse[]>([]);
  const [displays, setDisplays] = useState<
    Array<{ id: string; name: string; locationLabel: string | null }>
  >([]);
  const [category, setCategory] = useState<SurveyCategory | "">("");
  const [displayId, setDisplayId] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      setIsLoading(true);
      try {
        const [surveyItems, displayItems] = await Promise.all([
          listAdminSurveys({ limit: 50 }),
          listDisplays(),
        ]);
        if (!cancelled) {
          setItems(surveyItems);
          setDisplays(
            displayItems.map((display) => ({
              id: display.id,
              name: display.name,
              locationLabel: display.locationLabel,
            })),
          );
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Die Survey-Inbox konnte nicht geladen werden.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const surveyItems = await listAdminSurveys({
        category: category || undefined,
        displayId: displayId || undefined,
        query: query.trim() || undefined,
        limit: 50,
      });
      setItems(surveyItems);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Die Filter konnten nicht angewendet werden.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl bg-white p-6 shadow-lg">
          <h1 className="text-3xl font-bold">Survey-Inbox</h1>
          <p className="mt-2 text-sm text-slate-600">
            Neue Rueckmeldungen aus der Schuelerschaft werden hier gesammelt.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Filter</h2>
          <form
            className="mt-4 grid gap-4 md:grid-cols-4"
            onSubmit={handleFilterSubmit}
          >
            <label className="text-sm font-semibold text-slate-700">
              Kategorie
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as SurveyCategory | "")
                }
              >
                <option value="">Alle Kategorien</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Display
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={displayId}
                onChange={(event) => setDisplayId(event.target.value)}
              >
                <option value="">Alle Displays</option>
                {displays.map((display) => (
                  <option key={display.id} value={display.id}>
                    {display.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Freitextsuche
              <input
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Suche in Nachricht oder Name"
              />
            </label>

            <button
              className="rounded-md bg-slate-900 px-3 py-2 font-semibold text-white md:col-span-4 md:justify-self-start"
              type="submit"
            >
              Filter anwenden
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="text-xl font-semibold">Eingang</h2>
          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </p>
          ) : null}
          {isLoading ? (
            <p className="mt-4 text-sm text-slate-600">
              Rueckmeldungen werden geladen.
            </p>
          ) : items.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              Aktuell gibt es keine passenden Rueckmeldungen.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>{item.category.replaceAll("_", " ")}</span>
                    <span>•</span>
                    <span>{item.displayName}</span>
                    {item.locationLabel ? (
                      <>
                        <span>•</span>
                        <span>{item.locationLabel}</span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                    {item.message}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                    <span>Name: {item.submitterName || "Anonym"}</span>
                    <span>Klasse: {item.schoolClass || "Nicht angegeben"}</span>
                    <span>
                      Rueckkontakt:{" "}
                      {item.contactAllowed ? "Erlaubt" : "Nicht erlaubt"}
                    </span>
                    <span>
                      Eingang:{" "}
                      {new Date(item.createdAt).toLocaleString("de-DE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        hour12: false,
                      })}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
