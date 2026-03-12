import { useQuery } from "@tanstack/react-query";
import { daysUntil } from "../themeShared";
import { ModuleHeader } from "../ModuleHeader";
import {
  calendarEventsQueryOptions,
  type CalendarEvent,
} from "#/lib/api/dashboard";

function normalizeTimestamp(timestamp: number) {
  return timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1_000;
}

export function getUpcomingCalendarEvents(
  events: CalendarEvent[],
  now = new Date(),
) {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  return events
    .filter((event) => {
      const end = normalizeTimestamp(event.endDate);

      return end >= todayStart.getTime();
    })
    .sort(
      (left, right) =>
        normalizeTimestamp(left.startDate) -
        normalizeTimestamp(right.startDate),
    )
    .slice(0, 3);
}

// ─── Calendar events module ───────────────────────────────────────────────────────

export function CalendarModule() {
  const { data: events = [], isLoading } = useQuery(
    calendarEventsQueryOptions(9),
  );
  const upcomingEvents = getUpcomingCalendarEvents(events as CalendarEvent[]);

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
      ) : upcomingEvents.length === 0 ? (
        <div className="px-3 py-3 font-mono text-[11px] uppercase tracking-wide text-black/40">
          Keine Termine vorhanden
        </div>
      ) : (
        <div className="divide-y divide-black/10">
          {upcomingEvents.map((ev, i) => {
            const startTimestamp = normalizeTimestamp(ev.startDate);
            const start = new Date(startTimestamp);
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
              <div key={i} className="flex items-start gap-2 px-3 py-1.5">
                <div className="min-w-8 shrink-0 bg-black px-1.5 py-1 text-center">
                  <span className="block font-mono text-[9px] font-black uppercase text-white/50">
                    {start
                      .toLocaleDateString("de-DE", { month: "short" })
                      .toUpperCase()
                      .replace(".", "")}
                  </span>
                  <span className="block font-black text-sm leading-none text-white">
                    {start.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 font-semibold text-[11px] leading-tight text-black">
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
