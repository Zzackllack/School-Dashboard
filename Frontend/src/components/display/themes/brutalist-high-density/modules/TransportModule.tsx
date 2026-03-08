import {
  lineBadgeCls,
  minsUntil,
  ModuleHeader,
  useTransport,
} from "../BrutalistHighDensityTheme";

// ─── Transport module ─────────────────────────────────────────────────────────────
export function TransportModule() {
  const { stopName, departures, loading } = useTransport();
  const upcoming = departures
    .filter((d) => minsUntil(d.when ?? d.plannedWhen) >= -1)
    .slice(0, 8);

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-transport"
    >
      <ModuleHeader title="Abfahrten" sub={stopName || undefined} live />
      {loading && departures.length === 0 ? (
        <div className="px-3 py-4 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Lade Abfahrten…
        </div>
      ) : upcoming.length === 0 ? (
        <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Keine Abfahrten verfügbar
        </div>
      ) : (
        <div className="divide-y divide-black/10">
          {upcoming.map((dep, i) => {
            const mins = minsUntil(dep.when ?? dep.plannedWhen);
            const delay = dep.delay ? Math.round(dep.delay / 60) : 0;
            return (
              <div
                key={`${dep.tripId}-${i}`}
                className="flex items-center gap-2 px-3 py-1.5"
              >
                <span
                  className={`shrink-0 min-w-[2.8rem] px-1.5 py-0.5 text-center font-mono text-[10px] font-black tracking-wide ${lineBadgeCls(dep.line.product)}`}
                >
                  {dep.line.name}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-black/65">
                  {dep.direction}
                </span>
                <span
                  className={`shrink-0 font-black text-sm tabular-nums ${delay > 0 ? "text-red-600" : ""}`}
                >
                  {mins <= 0 ? "JETZT" : `${mins}`}
                </span>
                <span className="shrink-0 font-mono text-[9px] text-black/40 w-5 text-right">
                  {mins > 0 ? "MIN" : ""}
                </span>
                {delay > 0 && (
                  <span className="shrink-0 font-mono text-[9px] text-red-400">
                    +{delay}'
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
