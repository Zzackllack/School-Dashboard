import { createFileRoute } from "@tanstack/react-router";

function ThrowErrorRouteComponent() {
  throw new Error("Intentional route failure for e2e coverage");
}

export const Route = createFileRoute("/throw-error")({
  component: ThrowErrorRouteComponent,
});
