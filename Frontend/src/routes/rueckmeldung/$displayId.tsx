import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createSurveySubmission,
  getSurveyDisplayContext,
  type SurveyCategory,
  type SurveyDisplayContextResponse,
} from "#/lib/api/surveys";

const CATEGORY_OPTIONS: Array<{ value: SurveyCategory; label: string }> = [
  { value: "PROBLEM", label: "Problem" },
  { value: "WUNSCH", label: "Wunsch" },
  { value: "ALLGEMEINES_FEEDBACK", label: "Allgemeines Feedback" },
];

export const Route = createFileRoute("/rueckmeldung/$displayId" as never)({
  component: SurveyFeedbackPage,
});

export function SurveyFeedbackPage() {
  const { displayId } = useParams({ strict: false }) as { displayId: string };
  const [displayContext, setDisplayContext] =
    useState<SurveyDisplayContextResponse | null>(null);
  const [category, setCategory] = useState<SurveyCategory | "">("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [schoolClass, setSchoolClass] = useState("");
  const [contactAllowed, setContactAllowed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    async function loadDisplayContext() {
      try {
        const response = await getSurveyDisplayContext(displayId);
        if (!cancelled) {
          setDisplayContext(response);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Das Display konnte nicht geladen werden.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDisplayContext();

    return () => {
      cancelled = true;
    };
  }, [displayId]);

  function validateForm() {
    if (!category) {
      return "Bitte wähle eine Kategorie aus.";
    }
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return "Bitte gib eine Nachricht ein.";
    }
    if (trimmedMessage.length < 10) {
      return "Die Nachricht muss mindestens 10 Zeichen lang sein.";
    }
    if (trimmedMessage.length > 2000) {
      return "Die Nachricht darf maximal 2000 Zeichen lang sein.";
    }
    if (name.trim().length > 160) {
      return "Der Name darf maximal 160 Zeichen lang sein.";
    }
    if (schoolClass.trim().length > 40) {
      return "Die Klasse darf maximal 40 Zeichen lang sein.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || successMessage || !displayContext?.acceptingFeedback) {
      return;
    }

    const nextValidationMessage = validateForm();
    setValidationMessage(nextValidationMessage);
    setErrorMessage(null);
    if (nextValidationMessage) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createSurveySubmission({
        displayId,
        category: category as SurveyCategory,
        message: message.trim(),
        name: name.trim() || undefined,
        schoolClass: schoolClass.trim() || undefined,
        contactAllowed,
      });
      setSuccessMessage(
        "Danke. Deine Rückmeldung wurde gespeichert und an das Admin-Team weitergegeben.",
      );
      setCategory("");
      setMessage("");
      setName("");
      setSchoolClass("");
      setContactAllowed(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Die Rückmeldung konnte nicht gespeichert werden.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff4d6,transparent_40%),linear-gradient(180deg,#fffdf8_0%,#f1ebe1_100%)] px-4 py-8 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-[28px] border border-amber-200/70 bg-white/95 p-6 shadow-[0_24px_80px_rgba(120,83,25,0.12)] backdrop-blur sm:p-8">
        <header className="space-y-3">
          <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-800">
            Schüler-Rückmeldung
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            Dein Feedback zum Dashboard
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Melde Probleme, Wünsche oder allgemeines Feedback direkt zum
            aktuellen Display. Die Rückmeldung ist öffentlich, wird aber dem
            richtigen Display zugeordnet.
          </p>
        </header>

        {isLoading ? (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-semibold">Display wird geladen</h2>
            <p className="mt-2 text-sm text-slate-600">Einen Moment bitte.</p>
          </section>
        ) : errorMessage ? (
          <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <h2 className="text-lg font-semibold text-rose-900">
              Display nicht verfügbar
            </h2>
            <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>
          </section>
        ) : displayContext ? (
          <>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-semibold text-slate-900">
                {displayContext.displayName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {displayContext.locationLabel
                  ? `Standort: ${displayContext.locationLabel}`
                  : "Standort ist nicht hinterlegt."}
              </p>
              {!displayContext.acceptingFeedback ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Dieses Display nimmt aktuell keine Rückmeldungen entgegen.
                </p>
              ) : null}
            </section>

            {successMessage ? (
              <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="text-lg font-semibold text-emerald-950">
                  Rückmeldung gesendet
                </h2>
                <p className="mt-2 text-sm text-emerald-800">
                  {successMessage}
                </p>
              </section>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-800">
                Kategorie
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as SurveyCategory | "")
                  }
                  disabled={!displayContext.acceptingFeedback || isSubmitting}
                >
                  <option value="">Bitte auswählen</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Nachricht
                <textarea
                  className="mt-2 min-h-40 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  disabled={!displayContext.acceptingFeedback || isSubmitting}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Name (optional)
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={!displayContext.acceptingFeedback || isSubmitting}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-800">
                Klasse (optional)
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base"
                  value={schoolClass}
                  onChange={(event) => setSchoolClass(event.target.value)}
                  disabled={!displayContext.acceptingFeedback || isSubmitting}
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                  type="checkbox"
                  checked={contactAllowed}
                  onChange={(event) => setContactAllowed(event.target.checked)}
                  disabled={!displayContext.acceptingFeedback || isSubmitting}
                />
                <span>
                  Admins dürfen auf mich zukommen, falls Rückfragen oder mehr
                  Details hilfreich wären.
                </span>
              </label>

              {validationMessage ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {validationMessage}
                </p>
              ) : null}
              {errorMessage && !isLoading ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <button
                className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                type="submit"
                disabled={!displayContext.acceptingFeedback || isSubmitting}
              >
                {isSubmitting
                  ? "Rückmeldung wird gesendet ..."
                  : "Feedback senden"}
              </button>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}
