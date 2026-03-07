import { Outlet, createFileRoute } from "@tanstack/react-router";

function SetupLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/setup")({
  component: SetupLayout,
});
