import { AlarmClock, CalendarDays, CloudSun, TrainFront } from "lucide-react";
import CalendarEvents from "#/components/CalendarEvents";
import Clock from "#/components/Clock";
import Credits from "#/components/Credits";
import Holidays from "#/components/Holidays";
import SubstitutionPlanDisplay from "#/components/SubstitutionPlanDisplay";
import Transportation from "#/components/Transportation";
import Weather from "#/components/Weather";
import { useDisplayRuntime } from "#/components/display/useDisplayRuntime";
import type { DisplayThemeProps } from "#/components/display/themes/types";

const FOOTER_DATETIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

export function BrutalistHighDensityTheme({ displayId }: DisplayThemeProps) {
  const { currentTime, isHydrated } = useDisplayRuntime();

  return (
    <div
      className="min-h-screen bg-[#f4f4f0] text-black"
      data-testid="theme-brutalist-high-density"
    >
      <div className="min-h-screen border-4 border-black">
        <header className="flex h-16 items-center justify-between border-b-4 border-black bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-9 w-9 items-center justify-center border-2 border-black bg-[#FFD60A] sm:flex">
              <AlarmClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] uppercase tracking-[0.18em] text-black/70 sm:text-xs">
                Display Theme
              </p>
              <h1 className="truncate text-base font-black uppercase tracking-[0.08em] sm:text-xl">
                Daily Bulletin // {displayId}
              </h1>
            </div>
          </div>
          <div className="text-right">
            {isHydrated && currentTime ? (
              <Clock currentTime={currentTime} />
            ) : (
              <div data-testid="clock-placeholder" className="text-right">
                <div className="text-xl font-black sm:text-2xl">--:--:--</div>
                <div className="text-sm">--.--.----</div>
              </div>
            )}
          </div>
        </header>

        <main className="grid min-h-[calc(100vh-8.5rem)] grid-cols-1 lg:grid-cols-[70%_30%]">
          <section className="border-b-4 border-black bg-[linear-gradient(135deg,rgba(255,214,10,0.13),rgba(255,255,255,0.92))] p-3 sm:p-4 lg:border-b-0 lg:border-r-4 lg:p-5">
            <div className="mb-3 flex items-center justify-between border-b-2 border-black pb-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-black/60">
                  Substitution Plan
                </p>
                <h2 className="text-lg font-black uppercase tracking-[0.08em] sm:text-xl">
                  Core Schedule
                </h2>
              </div>
              <div className="flex gap-1">
                <span className="h-3 w-3 border-2 border-black bg-black" />
                <span className="h-3 w-3 border-2 border-black bg-transparent" />
              </div>
            </div>
            <SubstitutionPlanDisplay />
          </section>

          <aside className="space-y-4 overflow-y-auto bg-white p-3 sm:p-4 lg:p-5">
            <section className="border-2 border-black bg-[#e8f5ff] p-2">
              <div className="mb-2 flex items-center gap-2 border-b border-black pb-1">
                <CloudSun className="h-4 w-4" />
                <h3 className="text-xs font-black uppercase tracking-[0.16em]">
                  Weather
                </h3>
              </div>
              <Weather />
            </section>

            <section className="border-2 border-black bg-[#eef8ec] p-2">
              <div className="mb-2 flex items-center gap-2 border-b border-black pb-1">
                <TrainFront className="h-4 w-4" />
                <h3 className="text-xs font-black uppercase tracking-[0.16em]">
                  Transportation
                </h3>
              </div>
              <Transportation />
            </section>

            <section className="border-2 border-black bg-[#fff8e9] p-2">
              <div className="mb-2 flex items-center gap-2 border-b border-black pb-1">
                <CalendarDays className="h-4 w-4" />
                <h3 className="text-xs font-black uppercase tracking-[0.16em]">
                  Calendar + Holidays
                </h3>
              </div>
              <CalendarEvents />
              <Holidays />
            </section>

            <section className="border-2 border-black bg-white p-2">
              <Credits />
            </section>
          </aside>
        </main>

        <footer className="border-t-4 border-black bg-white px-4 py-2 text-xs font-mono uppercase tracking-[0.08em] sm:px-6">
          <span>Theme: Brutalist High Density</span>
          <span className="ml-3 text-black/70">
            {isHydrated && currentTime
              ? currentTime.toLocaleString("de-DE", FOOTER_DATETIME_OPTIONS)
              : "--"}
          </span>
        </footer>
      </div>
    </div>
  );
}
