import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, LayoutPanelTop, ShieldCheck } from "lucide-react";
import { WarningOverlay } from "#/components/display/WarningOverlay";
import type { WarningSnapshot } from "#/lib/api/warnings";

type DemoTheme = "default" | "brutalist-high-density";

const DEMO_WARNING_SNAPSHOT: WarningSnapshot = {
  lastCheckedAt: "2026-09-10T09:42:00+02:00",
  lastSuccessfulSyncAt: "2026-09-10T09:42:00+02:00",
  sourceAvailable: true,
  warnings: [
    {
      id: "demo-mow.DE-BE-BE-W001-20260910-000",
      messageType: "Alert",
      headline: "Starke Rauchentwicklung im Bereich Lichterfelde",
      description:
        "In der Nähe der Schule kommt es zu starker Rauchentwicklung durch einen Brand.",
      instruction:
        "Bleiben Sie im Gebäude. Fenster und Türen geschlossen halten. Folgen Sie den Anweisungen der Einsatzkräfte.",
      provider: "Berliner Feuerwehr",
      severity: "Severe",
      urgency: "Immediate",
      certainty: "Observed",
      event: "Brand / Rauchentwicklung",
      affectedAreas: ["Berlin-Lichterfelde", "Goethe-Gymnasium Lichterfelde"],
      sentAt: "2026-09-10T09:40:00+02:00",
      expiresAt: null,
      sourceUrl: "https://warnung.bund.de/meldungen",
      test: false,
    },
  ],
};

const THEME_COPY: Record<DemoTheme, { label: string; description: string }> = {
  default: {
    label: "Default",
    description: "Ruhige, warme Informationsansicht",
  },
  "brutalist-high-density": {
    label: "Brutalist High Density",
    description: "Kontrastreiche, dichte Anzeige",
  },
};

function DemoBackdrop({ theme }: { theme: DemoTheme }) {
  const isBrutalist = theme === "brutalist-high-density";
  const panelClass = isBrutalist
    ? "border-2 border-black bg-white"
    : "border border-[#c9bcad] bg-[#fbf8f1] shadow-[0_18px_60px_rgba(62,49,40,0.12)]";

  return (
    <main
      className={
        isBrutalist
          ? "min-h-screen bg-[#f5f4f0] p-6 font-mono text-black sm:p-10"
          : "min-h-screen bg-[#eee6dc] p-6 text-[#3e3128] sm:p-10"
      }
      data-demo-theme={theme}
    >
      <div className="mx-auto max-w-7xl">
        <header
          className={
            isBrutalist
              ? "flex items-end justify-between border-b-4 border-black pb-5"
              : "flex items-end justify-between border-b border-[#c9bcad] pb-5"
          }
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] opacity-55">
              Goethe Gymnasium Lichterfelde
            </p>
            <h1
              className={
                isBrutalist
                  ? "mt-3 text-4xl font-black uppercase tracking-[-0.06em] sm:text-6xl"
                  : "mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-6xl"
              }
            >
              Schul Dashboard
            </h1>
          </div>
          <div className="text-right text-xs font-bold uppercase tracking-[0.15em] opacity-60">
            <p>Donnerstag</p>
            <p className="mt-1 text-2xl tabular-nums">09:42</p>
          </div>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr_1fr]">
          <section className={`${panelClass} min-h-64 p-6`}>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-55">
              Vertretungsplan
            </p>
            <div className="mt-10 flex items-end justify-between">
              <p className="text-7xl font-black tabular-nums">12</p>
              <p className="max-w-32 text-right text-sm font-semibold opacity-60">
                Änderungen für heute
              </p>
            </div>
          </section>
          <section className={`${panelClass} min-h-64 p-6`}>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-55">
              Kalender
            </p>
            <p className="mt-10 text-2xl font-black">Fachbereichstag</p>
            <p className="mt-2 text-sm opacity-65">Aula · 11:00 Uhr</p>
          </section>
          <section className={`${panelClass} min-h-64 p-6`}>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-55">
              Wetter
            </p>
            <p className="mt-10 text-7xl font-black tabular-nums">18°</p>
            <p className="mt-2 text-sm opacity-65">Leicht bewölkt</p>
          </section>
        </div>

        <section className={`${panelClass} mt-5 p-6`}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] opacity-55">
              Nächste Hinweise
            </p>
            <span className="text-xs font-bold opacity-45">Live-Anzeige</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Raumänderungen", "Mensaplan", "ÖPNV-Abfahrten"].map((item) => (
              <div
                key={item}
                className={
                  isBrutalist
                    ? "border border-black/20 px-4 py-5 text-sm font-bold"
                    : "border border-[#c9bcad]/70 px-4 py-5 text-sm font-semibold"
                }
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function WarningDemoPage() {
  const [theme, setTheme] = useState<DemoTheme>("default");
  const [showWarning, setShowWarning] = useState(true);
  const themeCopy = THEME_COPY[theme];

  return (
    <div className="relative min-h-screen">
      <DemoBackdrop theme={theme} />

      <aside className="fixed bottom-5 left-5 z-[120] w-[min(24rem,calc(100vw-2.5rem))] border border-white/20 bg-[#111]/95 p-4 text-white shadow-2xl backdrop-blur sm:bottom-8 sm:left-8">
        <div className="flex items-start gap-3">
          <LayoutPanelTop className="mt-0.5 size-5 shrink-0 text-[#ff9f0a]" />
          <div>
            <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#ff9f0a]">
              Warnungsdemo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              {themeCopy.description}. Das rote Overlay ist absichtlich in
              beiden Themes identisch: Eine Warnung muss sofort erkennbar sein.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {(Object.keys(THEME_COPY) as DemoTheme[]).map((themeId) => (
            <button
              key={themeId}
              type="button"
              className={`border px-3 py-2 text-left text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9f0a] ${
                theme === themeId
                  ? "border-[#ff9f0a] bg-[#ff9f0a] text-[#111]"
                  : "border-white/25 text-white hover:bg-white/10"
              }`}
              onClick={() => setTheme(themeId)}
            >
              {THEME_COPY[themeId].label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 border border-white/25 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9f0a]"
          onClick={() => setShowWarning((visible) => !visible)}
        >
          {showWarning ? (
            <Eye className="size-4" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {showWarning
            ? "Warnungsoverlay ausblenden"
            : "Warnungsoverlay anzeigen"}
        </button>
      </aside>

      {showWarning ? (
        <WarningOverlay snapshotOverride={DEMO_WARNING_SNAPSHOT} />
      ) : null}
    </div>
  );
}

export const Route = createFileRoute("/warning-demo")({
  component: WarningDemoPage,
  head: () => ({
    meta: [
      { title: "Warnungsdemo | Schul Dashboard" },
      {
        name: "description",
        content: "Interaktive Vorschau des amtlichen Warnungs-Overlays.",
      },
    ],
  }),
});
