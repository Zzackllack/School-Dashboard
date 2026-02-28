import { createFileRoute } from "@tanstack/react-router";
import { DisplayPage } from "../components/display/DisplayPage";

export const Route = createFileRoute("/display/$screenId")({
  component: DisplayPage,
});
