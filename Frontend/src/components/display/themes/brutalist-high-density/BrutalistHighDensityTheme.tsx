import Clock from "#/components/Clock";
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

function ThemeSlot({
  title,
  description,
  testId,
}: {
  title: string;
  description: string;
  testId: string;
}) {
  return (
    <section className="border-2 border-black bg-white p-3" data-testid={testId}>
      <h2 className="mb-2 border-b border-black pb-1 text-lg font-black uppercase">
        {title}
      </h2>
      <p className="text-sm text-black/70">{description}</p>
      <p className="mt-2 border border-dashed border-black/40 p-2 text-xs font-mono uppercase tracking-wide text-black/60">
        TODO: implement module renderer for this theme.
      </p>
    </section>
  );
}

function GradeColumn({
  title,
  color,
}: {
  title: string;
  color: string;
}) {
  return (
    <div className="flex min-h-0 flex-col border-r-4 border-black last:border-r-0">
      <header className={`${color} border-b-4 border-black p-3`}>
        <h3 className="text-5xl font-black tracking-tight">{title}</h3>
      </header>
      <div className="min-h-0 flex-1 bg-[#faf9f5] p-3">
        <div className="h-full border border-dashed border-black/40 p-3 text-xs font-mono uppercase tracking-wide text-black/60">
          TODO: implement substitution card renderer for grade group {title}.
        </div>
      </div>
    </div>
  );
}

export function BrutalistHighDensityTheme({ displayId }: DisplayThemeProps) {
  const { currentTime, isHydrated } = useDisplayRuntime();

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black" data-testid="theme-brutalist-high-density">
      <div className="min-h-screen border-4 border-black">
        <header className="flex h-16 items-center justify-between border-b-4 border-black bg-white px-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/70">
              Display {displayId}
            </p>
            <h1 className="text-xl font-black uppercase tracking-[0.08em]">
              Theme Harness: Brutalist High Density
            </h1>
          </div>
          <div className="text-right">
            {isHydrated && currentTime ? (
              <Clock currentTime={currentTime} />
            ) : (
              <div data-testid="clock-placeholder" className="text-right">
                <div className="text-xl font-black">--:--:--</div>
                <div className="text-sm">--.--.----</div>
              </div>
            )}
          </div>
        </header>

        <main className="grid min-h-[calc(100vh-8.5rem)] grid-cols-1 lg:grid-cols-[70%_30%]">
          <section className="grid min-h-0 grid-cols-1 border-b-4 border-black lg:grid-cols-3 lg:border-b-0 lg:border-r-4">
            <div className="col-span-full border-b-4 border-black bg-white px-3 py-2">
              <h2 className="text-lg font-black uppercase tracking-[0.08em]">
                Vertretungspläne
              </h2>
              <p className="text-xs font-mono uppercase tracking-wide text-black/60">
                Theme slot scaffold. Connect normalized substitution data here.
              </p>
            </div>
            <GradeColumn title="07-08" color="bg-[#FFD60A]" />
            <GradeColumn title="09-10" color="bg-[#32D74B]" />
            <GradeColumn title="11-12" color="bg-[#FF9F0A]" />
          </section>

          <aside className="space-y-4 overflow-y-auto bg-white p-4">
            <ThemeSlot
              testId="module-weather"
              title="Wetter"
              description="Hook weather query + forecast mapper into this slot."
            />
            <ThemeSlot
              testId="module-transport"
              title="Öffentliche Verkehrsmittel"
              description="Hook transportation queries + departure list renderer here."
            />
            <ThemeSlot
              testId="module-calendar"
              title="Kommende Termine"
              description="Hook calendar events query + event card renderer here."
            />
            <ThemeSlot
              testId="module-holidays"
              title="Nächste Schulferien"
              description="Hook holiday source + holiday list renderer here."
            />
          </aside>
        </main>

        <footer className="border-t-4 border-black bg-white px-6 py-2 text-xs font-mono uppercase tracking-[0.08em]">
          Harness only | Stand: {isHydrated && currentTime ? currentTime.toLocaleString("de-DE", FOOTER_DATETIME_OPTIONS) : "--"}
        </footer>
      </div>
    </div>
  );
}
