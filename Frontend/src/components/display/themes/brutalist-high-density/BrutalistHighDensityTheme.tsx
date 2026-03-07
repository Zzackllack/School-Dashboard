import Clock from "#/components/Clock";
import type { DisplayThemeProps } from "#/components/display/themes/types";
import { useDisplayRuntime } from "#/components/display/useDisplayRuntime";
import {
  calendarEventsQueryOptions,
  substitutionPlansQueryOptions,
  type CalendarEvent,
  type SubstitutionEntry,
} from "#/lib/api/dashboard";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import holidaysData from "../../../../assets/holidays.json";

// ─── Constants ──────────────────────────────────────────────────────────────────

const SCHOOL_LAT = 52.43432378391319;
const SCHOOL_LNG = 13.305375391277634;

const FOOTER_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

const GRADE_COLUMNS = [
  { id: "07-08", label: "07—08", color: "bg-[#FFD60A]", grades: [7, 8] },
  { id: "09-10", label: "09—10", color: "bg-[#32D74B]", grades: [9, 10] },
  { id: "11-12", label: "11—12", color: "bg-[#FF9F0A]", grades: [11, 12] },
] as const;

// ─── Types ───────────────────────────────────────────────────────────────────────

interface WeatherApiResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

interface BvgStop {
  id: string;
  name: string;
  products: Record<string, boolean>;
}

interface BvgDeparture {
  tripId: string;
  direction: string;
  line: { name: string; product: string };
  when: string | null;
  plannedWhen: string;
  delay: number | null;
}

interface HolidayEntry {
  name: string;
  start: string;
  end: string;
  type: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────────

type BadgeVariant =
  | "red"
  | "amber"
  | "blue"
  | "cyan"
  | "green"
  | "indigo"
  | "purple"
  | "gray";

const BADGE_CLS: Record<BadgeVariant, string> = {
  red: "bg-red-600 text-white",
  amber: "bg-amber-400 text-black",
  blue: "bg-blue-600 text-white",
  cyan: "bg-cyan-600 text-white",
  green: "bg-green-600 text-white",
  indigo: "bg-indigo-600 text-white",
  purple: "bg-purple-600 text-white",
  gray: "bg-gray-700 text-white",
};

function getTypeBadge(type: string): { label: string; variant: BadgeVariant } {
  const t = type.toLowerCase();
  if (t.includes("entfall") || t.includes("ausfall"))
    return { label: "ENTFALL", variant: "red" };
  if (t.includes("vertr") || t.includes("vertretung"))
    return { label: "VERTRETUNG", variant: "amber" };
  if (t.includes("raumänd") || t.includes("raumänderung") || t.includes("raum"))
    return { label: "RAUM", variant: "blue" };
  if (t.includes("verlegung") || t.includes("verleg"))
    return { label: "VERLEGUNG", variant: "cyan" };
  if (t.includes("eva") || t.includes("eigenverantwort"))
    return { label: "EVA", variant: "indigo" };
  if (t.includes("veranst")) return { label: "VERANST.", variant: "purple" };
  if (t.includes("mitbetr")) return { label: "MITBETR.", variant: "green" };
  if (t.includes("geändert") || t.includes("geaendert"))
    return { label: "GEÄNDERT", variant: "blue" };
  return { label: type.toUpperCase(), variant: "gray" };
}

function getGradeNum(classes: string): number | null {
  const parts = classes
    .trim()
    .split(/[,;\s]+/)
    .filter(Boolean);
  for (const p of parts) {
    const n = parseInt(p.replace(/\D/g, ""), 10);
    if (!isNaN(n) && n >= 5 && n <= 13) return n;
  }
  return null;
}

function filterByGrades(
  entries: SubstitutionEntry[],
  grades: readonly number[],
): SubstitutionEntry[] {
  return entries.filter((e) => {
    const g = getGradeNum(e.classes);
    return g !== null && (grades as number[]).includes(g);
  });
}

function weatherDesc(code: number): string {
  if (code === 0) return "Klarer Himmel";
  if (code === 1) return "Überwiegend klar";
  if (code === 2) return "Teilweise bewölkt";
  if (code === 3) return "Bedeckt";
  if (code === 45 || code === 48) return "Nebel";
  if (code >= 51 && code <= 55) return "Nieselregen";
  if (code >= 61 && code <= 65) return "Regen";
  if (code >= 71 && code <= 77) return "Schneefall";
  if (code >= 80 && code <= 82) return "Regenschauer";
  if (code >= 85 && code <= 86) return "Schneeschauer";
  if (code >= 95 && code <= 99) return "Gewitter";
  return "Unbekannt";
}

function weatherSymbol(code: number): string {
  if (code === 0) return "☀";
  if (code === 1) return "🌤";
  if (code === 2) return "⛅";
  if (code === 3) return "☁";
  if (code === 45 || code === 48) return "🌫";
  if (code >= 51 && code <= 55) return "🌦";
  if (code >= 61 && code <= 65) return "🌧";
  if (code >= 71 && code <= 77) return "❄";
  if (code >= 80 && code <= 82) return "🌧";
  if (code >= 85 && code <= 86) return "🌨";
  if (code >= 95) return "⛈";
  return "○";
}

function lineBadgeCls(product: string): string {
  switch (product) {
    case "suburban":
      return "bg-[#009252] text-white";
    case "subway":
      return "bg-[#0067B3] text-white";
    case "tram":
      return "bg-[#BE1414] text-white";
    case "bus":
      return "bg-[#8B008B] text-white";
    case "regional":
      return "bg-[#6B2F86] text-white";
    case "ferry":
      return "bg-[#0071B3] text-white";
    default:
      return "bg-gray-700 text-white";
  }
}

function minsUntil(isoOrNull: string | null): number {
  if (!isoOrNull) return 0;
  return Math.ceil((new Date(isoOrNull).getTime() - Date.now()) / 60_000);
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

function fmtHolidayName(name: string): string {
  return name
    .replace(/\s+(berlin|hamburg|bremen|sachsen|nrw)$/i, "")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function nearestHourIdx(times: string[]): number {
  const now = new Date();
  const hourStr = `${now.toISOString().substring(0, 13)}:00`;
  const exact = times.indexOf(hourStr);
  if (exact !== -1) return exact;
  let best = 0,
    bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

// ─── Per-container auto-scroll hook ──────────────────────────────────────────────

function useContainerAutoScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  deps: unknown[],
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = true;
    let tid: ReturnType<typeof setTimeout> | undefined;
    let rid: number | undefined;

    const sleep = (ms: number) =>
      new Promise<void>((res) => {
        if (!active) return res();
        tid = setTimeout(res, ms);
      });

    const animateTo = (target: number, ms: number) =>
      new Promise<void>((res) => {
        const container = ref.current;
        if (!container || !active) return res();
        const from = container.scrollTop;
        const dist = target - from;
        if (Math.abs(dist) < 2) return res();
        const t0 = performance.now();
        const step = (now: number) => {
          if (!active) return res();
          const c = ref.current;
          if (!c) return res();
          const p = Math.min((now - t0) / ms, 1);
          c.scrollTop = from + dist * (0.5 - Math.cos(p * Math.PI) / 2);
          if (p < 1) {
            rid = requestAnimationFrame(step);
          } else {
            res();
          }
        };
        rid = requestAnimationFrame(step);
      });

    (async () => {
      await sleep(2_500);
      while (active) {
        const c = ref.current;
        if (!c) break;
        const maxScroll = c.scrollHeight - c.clientHeight;
        if (maxScroll <= 24) {
          await sleep(2_000);
          continue;
        }
        const dur = Math.max(4_000, (maxScroll / 48) * 1_000);
        await animateTo(maxScroll, dur);
        await sleep(4_000);
        if (!active) break;
        await animateTo(0, dur * 0.65);
        await sleep(3_000);
      }
    })().catch(() => {});

    return () => {
      active = false;
      if (tid !== undefined) clearTimeout(tid);
      if (rid !== undefined) cancelAnimationFrame(rid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

// ─── Data hooks ───────────────────────────────────────────────────────────────────

function useWeather() {
  return useQuery<WeatherApiResponse>({
    queryKey: ["weather-bru", SCHOOL_LAT, SCHOOL_LNG],
    queryFn: async () => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(SCHOOL_LAT));
      url.searchParams.set("longitude", String(SCHOOL_LNG));
      url.searchParams.set("current_weather", "true");
      url.searchParams.set("hourly", "temperature_2m,relativehumidity_2m");
      url.searchParams.set(
        "daily",
        "temperature_2m_max,temperature_2m_min,weathercode",
      );
      url.searchParams.set("timezone", "Europe/Berlin");
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(`Wetterdaten-Fehler: ${r.status}`);
      return r.json();
    },
    refetchInterval: 30 * 60 * 1_000,
  });
}

function useTransport() {
  const [stop, setStop] = useState<BvgStop | null>(null);
  const [departures, setDepartures] = useState<BvgDeparture[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: nearby } = useQuery<BvgStop[]>({
    queryKey: ["bvg-nearby-bru", SCHOOL_LAT, SCHOOL_LNG],
    queryFn: async () => {
      const r = await fetch(
        `https://v6.bvg.transport.rest/locations/nearby?latitude=${SCHOOL_LAT}&longitude=${SCHOOL_LNG}&results=20`,
      );
      if (!r.ok) throw new Error(`BVG-Fehler: ${r.status}`);
      return r.json();
    },
    refetchInterval: 30 * 60 * 1_000,
  });

  useEffect(() => {
    if (nearby?.length) {
      setStop((prev) =>
        prev && nearby.some((s) => s.id === prev.id) ? prev : nearby[0],
      );
    }
  }, [nearby]);

  const fetchDeps = useCallback(async (stopId: string) => {
    setLoading(true);
    try {
      const r = await fetch(
        `https://v6.bvg.transport.rest/stops/${stopId}/departures?results=10&duration=60`,
      );
      if (!r.ok) throw new Error(`BVG-Abfahrten-Fehler: ${r.status}`);
      const d = await r.json();
      setDepartures(Array.isArray(d.departures) ? d.departures : []);
    } catch {
      setDepartures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!stop?.id) return;
    fetchDeps(stop.id);
    const iv = setInterval(() => fetchDeps(stop.id), 3 * 60 * 1_000);
    return () => clearInterval(iv);
  }, [stop, fetchDeps]);

  return { stopName: stop?.name ?? "", departures, loading };
}

// ─── Small UI primitives ──────────────────────────────────────────────────────────

function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  return (
    <span
      className={`inline-block shrink-0 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${BADGE_CLS[variant]}`}
    >
      {label}
    </span>
  );
}

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1 bg-black px-2 py-0.5 font-mono text-[10px] font-black text-white">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
      LIVE
    </span>
  );
}

function ModuleHeader({
  title,
  sub,
  live,
}: {
  title: string;
  sub?: string;
  live?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b-2 border-black px-3 py-2">
      <div>
        <div className="font-black text-xs uppercase tracking-[0.08em]">
          {title}
        </div>
        {sub && (
          <div className="font-mono text-[10px] uppercase tracking-wide text-black/40">
            {sub}
          </div>
        )}
      </div>
      {live && <LiveDot />}
    </div>
  );
}

function NoChanges() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="text-3xl text-black/20">✓</span>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-black/30">
        Keine Änderungen
      </p>
      <p className="mt-0.5 font-mono text-[9px] text-black/20">
        Einen schönen Tag!
      </p>
    </div>
  );
}

// ─── Substitution card ────────────────────────────────────────────────────────────

function valid(s: string | null | undefined): boolean {
  return !!s && s !== "---" && s.trim() !== "";
}

function SubstCard({ entry }: { entry: SubstitutionEntry }) {
  const badge = getTypeBadge(entry.type);
  const subject = valid(entry.subject)
    ? entry.subject
    : valid(entry.originalSubject)
      ? entry.originalSubject
      : "";
  const hasSub = valid(entry.substitute);
  const hasAbsent = valid(entry.absent);
  const hasRoom = valid(entry.newRoom);
  const hasPeriod = valid(entry.period);
  const hasComment = valid(entry.comment);

  return (
    <div className="border-2 border-black bg-white">
      <div className="flex items-start gap-2 px-2.5 pt-2 pb-0">
        <div className="min-w-0 flex-1">
          <span className="font-black text-sm uppercase tracking-tight">
            {entry.classes}
          </span>
          {subject && (
            <span className="ml-1.5 text-sm font-semibold text-black/80">
              {subject}
            </span>
          )}
        </div>
        <Badge label={badge.label} variant={badge.variant} />
      </div>

      {(hasAbsent || hasSub) && (
        <div className="px-2.5 pt-1 text-xs text-black/65">
          {hasAbsent && hasSub ? (
            <span>
              {entry.absent} <span className="font-mono text-black/35">→</span>{" "}
              <span className="font-semibold">{entry.substitute}</span>
            </span>
          ) : hasSub ? (
            <span className="font-semibold">{entry.substitute}</span>
          ) : (
            <span className="line-through text-black/35">{entry.absent}</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-3 px-2.5 pb-2 pt-1">
        {hasPeriod && (
          <span className="font-mono text-[11px] text-black/45">
            Std.&thinsp;{entry.period}
          </span>
        )}
        {hasRoom && (
          <span className="font-mono text-[11px] text-black/45">
            Raum&thinsp;{entry.newRoom}
          </span>
        )}
        {hasComment && (
          <span className="font-mono text-[11px] italic text-black/35 truncate max-w-[12rem]">
            {entry.comment}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Grade column ─────────────────────────────────────────────────────────────────

function GradeColumn({
  col,
  entries,
  borderLeft,
}: {
  col: (typeof GRADE_COLUMNS)[number];
  entries: SubstitutionEntry[];
  borderLeft: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useContainerAutoScroll(ref, [entries.length]);

  return (
    <div
      className={`flex flex-1 flex-col overflow-hidden${borderLeft ? " border-l-4 border-black" : ""}`}
    >
      {/* Column header */}
      <div
        className={`${col.color} shrink-0 border-b-4 border-black px-4 pb-2 pt-3`}
      >
        <div className="flex items-end justify-between">
          <h2
            className="font-black leading-none tracking-tighter"
            style={{ fontSize: "clamp(2.25rem, 3.5vw, 3.5rem)" }}
          >
            {col.label}
          </h2>
          {entries.length > 0 && (
            <span className="font-mono text-[10px] uppercase tracking-wide text-black/55 pb-0.5">
              {entries.length}&thinsp;Eintr.
            </span>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/45 mt-0.5">
          Vertretungen
        </p>
      </div>

      {/* Scrollable entries */}
      <div
        ref={ref}
        className="flex-1 space-y-2 overflow-y-scroll bg-[#f5f4f0] p-2"
        style={{ scrollbarWidth: "none" }}
      >
        {entries.length === 0 ? (
          <NoChanges />
        ) : (
          entries.map((e, i) => (
            <SubstCard
              key={`${col.id}-${e.classes}-${e.period}-${i}`}
              entry={e}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Weather module ───────────────────────────────────────────────────────────────

function WeatherModule() {
  const { data, isLoading } = useWeather();

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-weather"
    >
      <ModuleHeader title="Wetter" live />
      {isLoading || !data ? (
        <div className="px-3 py-4 font-mono text-[11px] uppercase tracking-wide text-black/40">
          {isLoading ? "Lade Wetterdaten…" : "Keine Wetterdaten"}
        </div>
      ) : (
        <div className="px-3 py-3">
          {/* Current */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                className="font-black leading-none tracking-tighter"
                style={{ fontSize: "clamp(2.5rem, 4vw, 3rem)" }}
              >
                {Math.round(data.current_weather.temperature)}°
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wide text-black/60">
                {weatherDesc(data.current_weather.weathercode)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-black/40">
                Wind {Math.round(data.current_weather.windspeed)}&thinsp;km/h
                {(() => {
                  const idx = nearestHourIdx(data.hourly.time);
                  const hum = data.hourly.relativehumidity_2m[idx];
                  return hum !== undefined ? ` · Feuchte ${hum}%` : "";
                })()}
              </div>
            </div>
            <span
              className="text-4xl leading-none"
              role="img"
              aria-label={weatherDesc(data.current_weather.weathercode)}
            >
              {weatherSymbol(data.current_weather.weathercode)}
            </span>
          </div>

          {/* 3-hour forecast */}
          {(() => {
            const base = nearestHourIdx(data.hourly.time);
            const slots = [1, 2, 3].map((o) => ({
              time: data.hourly.time[base + o]
                ? new Date(data.hourly.time[base + o]).toLocaleTimeString(
                    "de-DE",
                    { hour: "2-digit", minute: "2-digit" },
                  )
                : "--:--",
              temp: data.hourly.temperature_2m[base + o],
            }));
            return (
              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-black/10 pt-2">
                {slots.map((s) => (
                  <div key={s.time} className="text-center">
                    <div className="font-mono text-[9px] text-black/40">
                      {s.time}
                    </div>
                    <div className="font-black text-sm">
                      {s.temp !== undefined ? `${Math.round(s.temp)}°` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ─── Transport module ─────────────────────────────────────────────────────────────

function TransportModule() {
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

// ─── Calendar events module ───────────────────────────────────────────────────────

function CalendarModule() {
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

// ─── Holidays module ──────────────────────────────────────────────────────────────

function HolidaysModule() {
  const holidays = useMemo(() => {
    const now = new Date();
    const data = holidaysData as Record<string, HolidayEntry[]>;
    const yr = now.getFullYear();
    return [...(data[yr] ?? []), ...(data[yr + 1] ?? [])]
      .filter((h) => h.end && new Date(h.end) >= now)
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
      <ModuleHeader title="Schulferien" />
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

// ─── Credits module ───────────────────────────────────────────────────────────────

function CreditsModule() {
  return (
    <div className="shrink-0" data-testid="module-credits">
      <ModuleHeader title="System" />
      <div className="px-3 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wide text-black/50 leading-relaxed">
          Entwickelt mit ♥ von{" "}
          <span className="font-black text-black">Cédric</span> &amp; dem
          Informatik‑LK&thinsp;24/26
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-px flex-1 bg-black/10" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-black/20">
            GGL · Lichterfelde
          </span>
          <div className="h-px flex-1 bg-black/10" />
        </div>
      </div>
    </div>
  );
}

// ─── Main theme export ────────────────────────────────────────────────────────────

export function BrutalistHighDensityTheme({ displayId }: DisplayThemeProps) {
  const { currentTime, isHydrated } = useDisplayRuntime();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fetch substitution data
  const { data: plans = [] } = useQuery(substitutionPlansQueryOptions);
  const allEntries = useMemo(() => plans.flatMap((p) => p.entries), [plans]);

  useContainerAutoScroll(sidebarRef, []);

  return (
    <div
      className="flex h-screen flex-col overflow-hidden bg-[#f5f4f0] text-black"
      data-testid="theme-brutalist-high-density"
    >
      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between border-b-4 border-black bg-white px-5 py-2.5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-black/40">
            Goethe-Gymnasium Lichterfelde
          </p>
          <h1 className="font-black text-xl uppercase tracking-[0.04em] leading-tight">
            Tagesvertretungsplan
          </h1>
        </div>
        <div data-testid="module-clock">
          {isHydrated && currentTime ? (
            <Clock currentTime={currentTime} />
          ) : (
            <div className="text-right">
              <div className="font-black text-2xl tabular-nums">--:--:--</div>
              <div className="font-mono text-xs text-black/40">--.--.----</div>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <div className="flex min-h-0 flex-1">
        {/* Grade columns – 70% */}
        <section className="flex min-h-0 flex-1 overflow-hidden border-r-4 border-black">
          {GRADE_COLUMNS.map((col, idx) => (
            <GradeColumn
              key={col.id}
              col={col}
              entries={filterByGrades(allEntries, col.grades)}
              borderLeft={idx > 0}
            />
          ))}
        </section>

        {/* Info sidebar – 30% */}
        <aside
          ref={sidebarRef}
          className="flex min-h-0 w-[30%] shrink-0 flex-col overflow-y-scroll bg-white"
          style={{ scrollbarWidth: "none" }}
        >
          <WeatherModule />
          <TransportModule />
          <CalendarModule />
          <HolidaysModule />
          <CreditsModule />
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer className="flex shrink-0 items-center justify-between border-t-2 border-black bg-black px-5 py-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
          System-Status:&thinsp;Online · Anzeige&thinsp;{displayId}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/50">
          {isHydrated && currentTime
            ? currentTime.toLocaleString("de-DE", FOOTER_OPTIONS)
            : "-- --.--.---- --:--:--"}
        </span>
      </footer>
    </div>
  );
}
