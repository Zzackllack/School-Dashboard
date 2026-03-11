import { useEffect, useState } from "react";
import { ModuleHeader } from "../ModuleHeader";
import { lineBadgeCls, minsUntil, useTransport } from "../themeShared";

const COUNTDOWN_TRANSITION_MS = 420;

function CountdownValue({
  value,
  emphasized,
}: {
  value: string;
  emphasized: boolean;
}) {
  const [rendered, setRendered] = useState(value);
  const [outgoing, setOutgoing] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "animating">("idle");

  useEffect(() => {
    if (value === rendered) {
      return;
    }

    setOutgoing(rendered);
    setRendered(value);
    setPhase("animating");

    const timeoutId = window.setTimeout(() => {
      setOutgoing(null);
      setPhase("idle");
    }, COUNTDOWN_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [rendered, value]);

  const toneClass = emphasized ? "text-red-600" : "text-black";

  return (
    <span
      className={`relative inline-flex h-[1.05em] min-w-[2ch] items-center justify-end overflow-hidden font-black text-sm tabular-nums ${toneClass}`}
      aria-live="off"
    >
      {outgoing ? (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0"
          style={{
            opacity: phase === "animating" ? 0 : 1,
            transform:
              phase === "animating"
                ? "translate3d(0,-115%,0) scale(0.92)"
                : "translate3d(0,0,0) scale(1)",
            transition: `transform ${COUNTDOWN_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${COUNTDOWN_TRANSITION_MS}ms ease`,
          }}
        >
          {outgoing}
        </span>
      ) : null}
      <span
        className={phase === "animating" ? "absolute right-0 top-0" : ""}
        style={{
          opacity: phase === "animating" ? 1 : 1,
          transform:
            phase === "animating"
              ? "translate3d(0,0,0) scale(1)"
              : "translate3d(0,0,0) scale(1)",
          transition:
            phase === "animating"
              ? `transform ${COUNTDOWN_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${COUNTDOWN_TRANSITION_MS}ms ease`
              : undefined,
        }}
      >
        {rendered}
      </span>
      {phase === "animating" ? (
        <span
          aria-hidden="true"
          className="absolute right-0 top-0"
          style={{
            opacity: 0,
            transform: "translate3d(0,115%,0) scale(0.92)",
            animation: `transport-countdown-enter ${COUNTDOWN_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
          }}
        >
          {rendered}
        </span>
      ) : null}
    </span>
  );
}

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
        const displayValue = mins <= 0 ? "JETZT" : `${mins}`;
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
              className="shrink-0"
              aria-label={
                mins <= 0
                  ? "Abfahrt jetzt"
                  : `Abfahrt in ${mins} Minuten`
              }
            >
              <CountdownValue value={displayValue} emphasized={delay > 0} />
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
  accentClass,
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
  accentClass: string;
}) {
  return (
    <section>
      <div className="flex items-center justify-between gap-2 border-b border-black/10 px-3 py-2">
        <div className="min-w-0">
          <h3 className="font-black text-xs uppercase tracking-[0.2em] text-black">
            {title}
          </h3>
          <p className="truncate font-mono text-[10px] uppercase tracking-wide text-black/40">
            {sub || "Kein Halt verfügbar"}
          </p>
        </div>
        <span
          className={`shrink-0 border-2 border-black px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-[0.2em] ${accentClass}`}
        >
          Live
        </span>
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
  const { bus, sBahn, loading, initialLoaded } = useTransport();
  const upcomingBus = bus.departures
    .filter((d) => minsUntil(d.when ?? d.plannedWhen) >= 0)
    .slice(0, 8);
  const upcomingSBahn = sBahn.departures
    .filter((d) => minsUntil(d.when ?? d.plannedWhen) >= 0)
    .slice(0, 6);

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-transport"
    >
      <style>{`
        @keyframes transport-countdown-enter {
          from {
            opacity: 0;
            transform: translate3d(0,115%,0) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translate3d(0,0,0) scale(1);
          }
        }
      `}</style>
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
        <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Keine Abfahrten verfügbar
        </div>
      ) : (
        <div className="divide-y-2 divide-black">
          <TransportSection
            title="Bus"
            sub={bus.stopName}
            departures={upcomingBus}
            accentClass="bg-[#8B008B] text-white"
          />
          <TransportSection
            title="S-Bahn"
            sub={sBahn.stopName}
            departures={upcomingSBahn}
            accentClass="bg-[#009252] text-white"
          />
        </div>
      )}
    </div>
  );
}
