import { useQuery } from "@tanstack/react-query";
import { daysUntil } from "../utils/daysUntil";
import { ModuleHeader } from "../BrutalistHighDensityTheme";
import {
  calendarEventsQueryOptions,
  type CalendarEvent,
} from "#/lib/api/dashboard";

// ─── Calendar events module ───────────────────────────────────────────────────────

export function CalendarModule() {
  const { data: events = [], isLoading } = useQuery(
    calendarEventsQueryOptions(6),
  );

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-calendar"
    >
      <ModuleHeader title="Kommende Termine" />
      {isLoading ? (
        <div className="px-3 py-4 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Lade Termine…
        </div>
      ) : events.length === 0 ? (
        <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Keine Termine vorhanden
        </div>
      ) : (
        <div className="divide-y divide-black/10">
          {(events as CalendarEvent[]).map((ev, i) => {
            const start = new Date(ev.startDate * 1_000);
            const days = daysUntil(start.toISOString().split("T")[0]);
            const dayLabel =
              days === 0
                ? "Heute"
                : days === 1
                  ? "Morgen"
                  : days < 0
                    ? "Läuft"
                    : `${days}d`;
            return (
              <div key={i} className="flex items-start gap-2.5 px-3 py-2">
                <div className="shrink-0 bg-black px-2 py-1 text-center min-w-[2.25rem]">
                  <span className="block font-mono text-[9px] font-black uppercase text-white/50">
                    {start
                      .toLocaleDateString("de-DE", { month: "short" })
                      .toUpperCase()
                      .replace(".", "")}
                  </span>
                  <span className="block font-black text-base leading-none text-white">
                    {start.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs leading-tight text-black line-clamp-2">
                    {ev.summary}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] text-black/40">
                    {start.toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}{" "}
                    · {dayLabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
