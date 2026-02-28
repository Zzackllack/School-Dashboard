import { createFileRoute } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import DashboardPage from "../components/DashboardPage";
import { prefetchDashboardData } from "../lib/query/dashboard";

export async function loadDashboardRouteData(queryClient: QueryClient) {
  await prefetchDashboardData(queryClient);
}

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      await loadDashboardRouteData(context.queryClient);
    } catch (error) {
      // Route must still render even if backend-dependent prefetch fails.
      console.warn("[dashboard-route] loader prefetch failed", error);
    }
  },
  component: DashboardRoute,
});

function DashboardRoute() {
  return <DashboardPage />;
}
