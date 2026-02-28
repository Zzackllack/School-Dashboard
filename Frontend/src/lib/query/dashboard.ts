import type { QueryClient } from "@tanstack/react-query";
import {
  calendarEventsQueryOptions,
  substitutionPlansQueryOptions,
} from "../api/dashboard";

export async function prefetchDashboardData(queryClient: QueryClient) {
  const results = await Promise.allSettled([
    queryClient.prefetchQuery(substitutionPlansQueryOptions),
    queryClient.prefetchQuery(calendarEventsQueryOptions(5)),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      // Keep route rendering resilient: module-level query UIs handle errors.
      console.warn("[dashboard-loader] prefetch failed", result.reason);
    }
  }
}
