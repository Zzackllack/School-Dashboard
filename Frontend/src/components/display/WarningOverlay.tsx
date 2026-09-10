import {
  AlertOctagon,
  ExternalLink,
  MapPin,
  Radio,
  ShieldAlert,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getMostUrgentWarning,
  warningSnapshotQueryOptions,
} from "#/lib/api/warnings";
import type { WarningSnapshot } from "#/lib/api/warnings";

interface WarningOverlayProps {
  snapshotOverride?: WarningSnapshot | null;
}

function formatWarningTime(value: string | null): string {
  if (!value) return "Zeitpunkt nicht verfügbar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Zeitpunkt nicht verfügbar";
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function severityLabel(severity: string | null): string {
  switch (severity?.toLowerCase()) {
    case "extreme":
      return "Extreme Gefahr";
    case "severe":
      return "Hohe Gefahr";
    case "moderate":
      return "Gefahr";
    case "minor":
      return "Gefahreninformation";
    default:
      return "Amtliche Warnung";
  }
}

export function WarningOverlay({ snapshotOverride }: WarningOverlayProps = {}) {
  const shouldFetch = snapshotOverride === undefined;
  const { data } = useQuery({
    ...warningSnapshotQueryOptions,
    enabled: shouldFetch,
  });
  const snapshot = shouldFetch ? data : snapshotOverride;
  const warning = getMostUrgentWarning(snapshot?.warnings ?? []);

  if (!warning) return null;

  const areas = warning.affectedAreas.filter(Boolean);
  const stale = snapshot?.sourceAvailable === false;
  const isTestWarning = warning.test;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[#170507]/90 p-5 text-white backdrop-blur-sm sm:p-10"
      role="alert"
      aria-live="assertive"
      data-testid="warning-overlay"
      data-warning-id={warning.id}
    >
      <section className="warning-overlay-panel relative w-full max-w-6xl overflow-hidden border-4 border-[#ff3b30] bg-[#25080b] shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_30px_90px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#ff3b30]/50 bg-[#ff3b30] px-5 py-3 text-[#25080b] sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <AlertOctagon
              className="size-7 shrink-0"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] sm:text-sm">
              {isTestWarning ? "Probewarnung" : "Amtliche Warnung"}
            </p>
          </div>
          <Radio className="size-6 shrink-0" aria-hidden="true" />
        </div>

        <div className="grid gap-7 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-10">
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.15em] text-[#ff9f0a]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="size-4" aria-hidden="true" />
                {severityLabel(warning.severity)}
              </span>
              {warning.event ? <span>· {warning.event}</span> : null}
            </div>
            <h1 className="max-w-5xl text-3xl font-black leading-[0.98] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
              {warning.headline}
            </h1>

            {warning.description ? (
              <p className="mt-6 max-w-4xl whitespace-pre-line text-lg leading-relaxed text-white/90 sm:text-2xl">
                {warning.description}
              </p>
            ) : null}

            {warning.instruction ? (
              <div className="mt-7 border-l-4 border-[#ff9f0a] bg-white/[0.07] px-5 py-4 sm:px-6">
                <p className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#ff9f0a]">
                  Handlungsempfehlung
                </p>
                <p className="mt-2 whitespace-pre-line text-lg font-bold leading-relaxed text-white sm:text-xl">
                  {warning.instruction}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col justify-between gap-6 border-t border-white/15 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-white/50">
                Betroffener Bereich
              </p>
              <div className="mt-3 flex items-start gap-2 text-lg font-bold leading-snug text-white">
                <MapPin
                  className="mt-0.5 size-5 shrink-0 text-[#ff9f0a]"
                  aria-hidden="true"
                />
                <span>
                  {areas.length > 0
                    ? areas.join(", ")
                    : "Region laut amtlicher Meldung"}
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-white/60">
              <p>
                <span className="text-white/40">Ausgegeben:</span>{" "}
                {formatWarningTime(warning.sentAt)}
              </p>
              {warning.provider ? (
                <p>
                  <span className="text-white/40">Herausgeber:</span>{" "}
                  {warning.provider}
                </p>
              ) : null}
              {stale ? (
                <p className="border border-[#ff9f0a]/40 bg-[#ff9f0a]/10 px-3 py-2 text-[#ffcf70]">
                  Letzter gültiger Warnstand. Die Quelle wird erneut geprüft.
                </p>
              ) : null}
            </div>

            <a
              className="pointer-events-auto inline-flex items-center justify-center gap-2 border border-white/30 px-4 py-3 text-center font-mono text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff9f0a]"
              href={warning.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Weitere Informationen
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </aside>
        </div>
      </section>
    </div>
  );
}
