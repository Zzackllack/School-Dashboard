import { queryOptions } from "@tanstack/react-query";
import { fetchJson } from "./http";

export interface SubstitutionEntry {
  classes: string;
  period: string;
  absent: string;
  substitute: string;
  originalSubject: string;
  subject: string;
  newRoom: string;
  type: string;
  comment: string;
  date: string;
}

export interface DailyNews {
  date: string;
  newsItems: string[];
}

export interface SubstitutionPlan {
  date: string;
  title: string;
  entries: SubstitutionEntry[];
  news: DailyNews;
}

export interface CalendarEvent {
  summary: string;
  description: string;
  location: string;
  startDate: number;
  endDate: number;
  allDay: boolean;
}

function hasVisibleValue(value: string | null | undefined) {
  return Boolean(value && value.trim() !== "" && value.trim() !== "---");
}

export function isMeaningfulSubstitutionEntry(entry: SubstitutionEntry) {
  if (!hasVisibleValue(entry.classes)) {
    return false;
  }

  return [
    entry.period,
    entry.absent,
    entry.substitute,
    entry.originalSubject,
    entry.subject,
    entry.newRoom,
    entry.type,
    entry.comment,
  ].some(hasVisibleValue);
}

export function sanitizeSubstitutionPlans(plans: SubstitutionPlan[]) {
  return plans.map((plan) => ({
    ...plan,
    entries: plan.entries.filter(isMeaningfulSubstitutionEntry),
  }));
}

export const substitutionPlansQueryOptions = queryOptions({
  queryKey: ["substitution-plans"],
  queryFn: async () =>
    sanitizeSubstitutionPlans(
      (await fetchJson<SubstitutionPlan[]>("/substitution/plans")) ?? [],
    ),
  refetchInterval: 5 * 60 * 1000,
});

const DEFAULT_CALENDAR_EVENTS_LIMIT = 5;
const MAX_CALENDAR_EVENTS_LIMIT = 50;

function normalizeCalendarEventsLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_CALENDAR_EVENTS_LIMIT;
  }

  const roundedLimit = Math.floor(limit);
  if (roundedLimit <= 0) {
    return DEFAULT_CALENDAR_EVENTS_LIMIT;
  }

  return Math.min(roundedLimit, MAX_CALENDAR_EVENTS_LIMIT);
}

export const calendarEventsQueryOptions = (
  limit = DEFAULT_CALENDAR_EVENTS_LIMIT,
) => {
  const normalizedLimit = normalizeCalendarEventsLimit(limit);

  return queryOptions({
    queryKey: ["calendar-events", normalizedLimit],
    queryFn: () =>
      fetchJson<CalendarEvent[]>(`/calendar/events?limit=${normalizedLimit}`),
    refetchInterval: 30 * 60 * 1000,
  });
};
