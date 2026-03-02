import { createFileRoute } from "@tanstack/react-router";
import { DisplayPage } from "../components/display/DisplayPage";
import { prefetchDashboardData } from "../lib/query/dashboard";

export const Route = createFileRoute("/display/$displayId")({
  loader: ({ context }) => prefetchDashboardData(context.queryClient),
  component: DisplayPage,
});
