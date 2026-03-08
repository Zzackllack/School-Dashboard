import {
  ModuleHeader,
  nearestHourIdx,
  useWeather,
  weatherDesc,
  weatherSymbol,
} from "../BrutalistHighDensityTheme";

// ─── Weather module ───────────────────────────────────────────────────────────────
export function WeatherModule() {
  const { data, isLoading } = useWeather();

  return (
    <div
      className="shrink-0 border-b-2 border-black"
      data-testid="module-weather"
    >
      <ModuleHeader title="Wetter" live />
      {isLoading || !data ? (
        <div className="px-3 py-4 font-mono text-[11px] uppercase tracking-wide text-black/40">
          {isLoading ? "Lade Wetterdaten…" : "Keine Wetterdaten"}
        </div>
      ) : (
        <div className="px-3 py-3">
          {/* Current */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div
                className="font-black leading-none tracking-tighter"
                style={{ fontSize: "clamp(2.5rem, 4vw, 3rem)" }}
              >
                {Math.round(data.current_weather.temperature)}°
              </div>
              <div className="mt-1 font-mono text-xs uppercase tracking-wide text-black/60">
                {weatherDesc(data.current_weather.weathercode)}
              </div>
              <div className="mt-0.5 font-mono text-[10px] text-black/40">
                Wind {Math.round(data.current_weather.windspeed)}&thinsp;km/h
                {(() => {
                  const idx = nearestHourIdx(data.hourly.time);
                  const hum = data.hourly.relativehumidity_2m[idx];
                  return hum !== undefined ? ` · Feuchte ${hum}%` : "";
                })()}
              </div>
            </div>
            <span
              className="text-4xl leading-none"
              role="img"
              aria-label={weatherDesc(data.current_weather.weathercode)}
            >
              {weatherSymbol(data.current_weather.weathercode)}
            </span>
          </div>

          {/* 3-hour forecast */}
          {(() => {
            const base = nearestHourIdx(data.hourly.time);
            const slots = [1, 2, 3].map((o) => ({
              time: data.hourly.time[base + o]
                ? new Date(data.hourly.time[base + o]).toLocaleTimeString(
                    "de-DE",
                    { hour: "2-digit", minute: "2-digit" },
                  )
                : "--:--",
              temp: data.hourly.temperature_2m[base + o],
            }));
            return (
              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-black/10 pt-2">
                {slots.map((s) => (
                  <div key={s.time} className="text-center">
                    <div className="font-mono text-[9px] text-black/40">
                      {s.time}
                    </div>
                    <div className="font-black text-sm">
                      {s.temp !== undefined ? `${Math.round(s.temp)}°` : "—"}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
