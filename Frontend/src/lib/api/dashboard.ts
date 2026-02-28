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

export const substitutionPlansQueryOptions = queryOptions({
  queryKey: ["substitution-plans"],
  queryFn: () => fetchJson<SubstitutionPlan[]>("/substitution/plans"),
  refetchInterval: 5 * 60 * 1000,
});

export const calendarEventsQueryOptions = (limit = 5) =>
  queryOptions({
    queryKey: ["calendar-events", limit],
    queryFn: () =>
      fetchJson<CalendarEvent[]>(`/calendar/events?limit=${limit}`),
    refetchInterval: 30 * 60 * 1000,
  });
