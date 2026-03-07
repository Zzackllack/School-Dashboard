import { useParams } from "@tanstack/react-router";
import DashboardPage from "../DashboardPage";

export function DisplayPage() {
  const { displayId } = useParams({ from: "/display/$displayId" });

  return (
    <main className="relative">
      <header className="absolute left-4 top-4 z-20 rounded-md bg-slate-900/85 px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
        Display: {displayId}
      </header>
      <DashboardPage />
    </main>
  );
}
