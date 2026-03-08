import Clock from "#/components/Clock";
import type { DisplayThemeProps } from "#/components/display/themes/types";
import { useDisplayRuntime } from "#/components/display/useDisplayRuntime";
import {
  substitutionPlansQueryOptions,
  type SubstitutionEntry,
} from "#/lib/api/dashboard";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { CreditsModule } from "./modules/CreditsModule";
import { TransportModule } from "./modules/TransportModule";
import { WeatherModule } from "./modules/WeatherModule";
import { HolidaysModule } from "./modules/HolidaysModule";
import { CalendarModule } from "./modules/CalendarModule";

// ─── Constants ──────────────────────────────────────────────────────────────────

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

function getGradeNums(classes: string | null | undefined): number[] {
  if (!classes) return [];
  return (classes.match(/\d+/g) ?? [])
    .map((token) => Number.parseInt(token, 10))
    .filter((n) => Number.isInteger(n) && n >= 5 && n <= 13);
}

function filterByGrades(
  entries: SubstitutionEntry[],
  grades: readonly number[],
): SubstitutionEntry[] {
  const gradeSet = new Set(grades);
  return entries.filter((e) => {
    const parsedGrades = getGradeNums(e.classes);
    return parsedGrades.some((grade) => gradeSet.has(grade));
  });
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
          <span className="font-mono text-[11px] italic text-black/35 truncate max-w-48">
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
  const resetKey = useMemo(
    () =>
      entries
        .map(
          (e) =>
            `${e.classes}|${e.period}|${e.type}|${e.subject}|${e.originalSubject}|${e.newRoom}|${e.comment}`,
        )
        .join("||"),
    [entries],
  );
  useContainerAutoScroll(ref, [resetKey]);

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

// ─── Main theme export ────────────────────────────────────────────────────────────

export function BrutalistHighDensityTheme({ displayId }: DisplayThemeProps) {
  const { currentTime, isHydrated } = useDisplayRuntime();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Fetch substitution data
  const {
    data: plans,
    isLoading,
    isError,
  } = useQuery(substitutionPlansQueryOptions);
  const allEntries = useMemo(
    () => (plans ?? []).flatMap((p) => p.entries),
    [plans],
  );

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
          <h2 className="sr-only">Vertretungspläne</h2>
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center border-black bg-[#f5f4f0] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/40">
                Lade Vertretungspläne…
              </p>
            </div>
          ) : isError ? (
            <div className="flex flex-1 items-center justify-center border-black bg-[#f5f4f0] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-red-700/80">
                Vertretungspläne nicht verfügbar
              </p>
            </div>
          ) : (
            GRADE_COLUMNS.map((col, idx) => (
              <GradeColumn
                key={col.id}
                col={col}
                entries={filterByGrades(allEntries, col.grades)}
                borderLeft={idx > 0}
              />
            ))
          )}
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
