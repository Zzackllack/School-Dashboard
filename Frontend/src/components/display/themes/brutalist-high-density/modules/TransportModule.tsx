import { ModuleHeader } from "../ModuleHeader";
import { lineBadgeCls, minsUntil, useTransport } from "../themeShared";

function DepartureList({
  departures,
}: {
  departures: Array<{
    tripId: string;
    direction: string;
    line: { name: string; product: string };
    when: string | null;
    plannedWhen: string;
    delay: number | null;
  }>;
}) {
  return (
    <div className="divide-y divide-black/10">
      {departures.map((dep, i) => {
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
            <span className="shrink-0 w-5 text-right font-mono text-[9px] text-black/40">
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
  );
}

function TransportSection({
  title,
  sub,
  departures,
}: {
  title: string;
  sub: string;
  departures: Array<{
    tripId: string;
    direction: string;
    line: { name: string; product: string };
    when: string | null;
    plannedWhen: string;
    delay: number | null;
  }>;
}) {
  return (
    <section>
      <div className="min-w-0 border-b border-black/10 px-3 py-2">
        <h3 className="font-black text-xs uppercase tracking-[0.2em] text-black">
          {title}
        </h3>
        <p className="truncate font-mono text-[10px] uppercase tracking-wide text-black/40">
          {sub || "Kein Halt verfügbar"}
        </p>
      </div>
      {departures.length === 0 ? (
        <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Keine Abfahrten verfügbar
        </div>
      ) : (
        <DepartureList departures={departures} />
      )}
    </section>
  );
}

// ─── Transport module ─────────────────────────────────────────────────────────────
export function TransportModule() {
  const { bus, sBahn, loading, initialLoaded, error } = useTransport();
  const upcomingBus = bus.departures
    .filter((d) => minsUntil(d.when ?? d.plannedWhen) >= 0)
    .slice(0, 3);
  const upcomingSBahn = sBahn.departures
    .filter((d) => minsUntil(d.when ?? d.plannedWhen) >= 0)
    .slice(0, 3);

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-transport"
    >
      <ModuleHeader
        title="Öffentliche Verkehrsmittel"
        // not needed since we show the stop names in the sections now, and often there is only one stop per section, making it redundant
        // sub={bus.stopName || sBahn.stopName || undefined}
        live
      />
      {!initialLoaded ||
      (loading &&
        bus.departures.length === 0 &&
        sBahn.departures.length === 0) ? (
        <div className="px-3 py-4 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Lade Abfahrten…
        </div>
      ) : upcomingBus.length === 0 && upcomingSBahn.length === 0 ? (
        error ? (
          <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-red-700">
            {error}
          </div>
        ) : (
          <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-black/40">
            Keine Abfahrten verfügbar
          </div>
        )
      ) : (
        <div className="divide-y-2 divide-black">
          <TransportSection
            title="Bus"
            sub={bus.stopName}
            departures={upcomingBus}
          />
          <TransportSection
            title="S-Bahn"
            sub={sBahn.stopName}
            departures={upcomingSBahn}
          />
        </div>
      )}
    </div>
  );
}
