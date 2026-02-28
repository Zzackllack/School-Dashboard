import { createFileRoute } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import DashboardPage from "../components/DashboardPage";
import { prefetchDashboardData } from "../lib/query/dashboard";

export async function loadDashboardRouteData(queryClient: QueryClient) {
  await prefetchDashboardData(queryClient);
}

export const Route = createFileRoute("/")({
  loader: ({ context }) => loadDashboardRouteData(context.queryClient),
  component: DashboardPage,
});
