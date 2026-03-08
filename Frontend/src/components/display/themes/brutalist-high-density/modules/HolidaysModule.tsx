import { ModuleHeader } from "../ModuleHeader";
import { useMemo } from "react";
import holidaysData from "../../../../../assets/holidays.json";
import { daysUntil } from "../themeShared";

interface HolidayEntry {
  name: string;
  start: string;
  end: string;
  type: string;
}

function fmtHolidayName(name: string): string {
  return name
    .replace(/\s+(berlin|hamburg|bremen|sachsen|nrw)$/i, "")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Holidays module ──────────────────────────────────────────────────────────────
export function HolidaysModule() {
  const holidays = useMemo(() => {
    const now = new Date();
    const data = holidaysData as Record<string, HolidayEntry[]>;
    const yr = now.getFullYear();
    return [...(data[yr] ?? []), ...(data[yr + 1] ?? [])]
      .filter((h) => {
        if (!h.end) return false;
        const endOfDay = new Date(h.end);
        endOfDay.setHours(23, 59, 59, 999);
        return endOfDay >= now;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, []);

  const next = holidays[0];
  const days = next ? daysUntil(next.start) : null;
  const pct =
    days !== null && days > 0
      ? Math.max(0, Math.min(100, ((60 - days) / 60) * 100))
      : null;

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-holidays"
    >
      <ModuleHeader title="Nächste Schulferien" />
      {!next ? (
        <div className="px-3 py-3 font-mono text-[11px] text-black/40">
          Keine Feriendaten
        </div>
      ) : (
        <div className="px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-black text-sm uppercase tracking-tight">
                {fmtHolidayName(next.name)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-black/40">
                {new Date(next.start).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
                {" – "}
                {new Date(next.end).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </div>
            </div>
            {days !== null && (
              <div className="shrink-0 text-right">
                <div
                  className="font-black leading-none"
                  style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
                >
                  {days <= 0 ? "Jetzt" : days}
                </div>
                {days > 0 && (
                  <div className="font-mono text-[9px] uppercase text-black/40">
                    Tage
                  </div>
                )}
              </div>
            )}
          </div>

          {pct !== null && days !== null && days > 0 && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-black/10">
                <div className="h-full bg-black" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-0.5 font-mono text-[9px] text-black/30">
                Noch {days} {days === 1 ? "Tag" : "Tage"}
              </p>
            </div>
          )}

          {holidays.length > 1 && (
            <div className="mt-2 space-y-0.5 border-t border-black/10 pt-2">
              {holidays.slice(1).map((h) => (
                <div
                  key={h.name + h.start}
                  className="flex justify-between font-mono text-[10px] text-black/40"
                >
                  <span>{fmtHolidayName(h.name)}</span>
                  <span>
                    {new Date(h.start).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
