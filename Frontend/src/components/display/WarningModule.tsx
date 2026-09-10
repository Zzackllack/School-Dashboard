import { ExternalLink, MapPin, ShieldAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  formatWarningCountdown,
  getMostUrgentWarning,
  useWarningAttention,
  warningSnapshotQueryOptions,
  type WarningNotice,
} from "#/lib/api/warnings";

export type WarningModuleVariant = "default" | "brutalist";

interface WarningModuleProps {
  variant: WarningModuleVariant;
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
      return "Information";
    default:
      return "Amtliche Warnung";
  }
}

export function WarningModule({ variant }: WarningModuleProps) {
  const { data } = useQuery(warningSnapshotQueryOptions);
  const warning = getMostUrgentWarning(data?.warnings ?? []);

  if (!warning) return null;

  return (
    <WarningModuleContent
      key={warning.id}
      warning={warning}
      variant={variant}
    />
  );
}

function WarningModuleContent({
  warning,
  variant,
}: {
  warning: WarningNotice;
  variant: WarningModuleVariant;
}) {
  const attention = useWarningAttention(warning.id);

  const area = warning.affectedAreas.find(Boolean);
  const isBrutalist = variant === "brutalist";
  const panelClass = isBrutalist
    ? "border-2 border-black bg-[#fff4f2] text-black"
    : "rounded-xl border border-red-200 border-l-4 border-l-red-600 bg-red-50 text-slate-900 shadow-sm dark:border-red-900/70 dark:bg-red-950/40 dark:text-white";

  return (
    <section
      className={`${panelClass} shrink-0 p-4`}
      role="status"
      aria-live="polite"
      data-testid="warning-module"
      data-warning-id={warning.id}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <ShieldAlert
            className={`size-5 shrink-0 ${isBrutalist ? "text-red-700" : "text-red-600"}`}
            aria-hidden="true"
          />
          <p className="truncate font-mono text-[10px] font-black uppercase tracking-[0.16em]">
            Warnung aktiv
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-red-700 dark:text-red-300">
          {severityLabel(warning.severity)}
        </span>
      </div>

      <h2 className="mt-3 line-clamp-2 text-base font-black leading-tight">
        {warning.headline}
      </h2>

      {area ? (
        <p className="mt-2 flex items-start gap-1.5 text-xs opacity-70">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{area}</span>
        </p>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-current/15 pt-3 font-mono text-[10px] uppercase tracking-[0.08em] opacity-70">
        <span>
          {attention.isExpanded
            ? `Vollbild noch ${formatWarningCountdown(attention.remainingMs)}`
            : "Vollbild minimiert"}
        </span>
        <a
          className="inline-flex shrink-0 items-center gap-1 font-black underline decoration-current/30 underline-offset-2 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          href={warning.sourceUrl}
          target="_blank"
          rel="noreferrer"
        >
          Details
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
