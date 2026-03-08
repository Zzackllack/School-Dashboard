import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

const SCHOOL_LAT = 52.43432378391319;
const SCHOOL_LNG = 13.305375391277634;

interface WeatherApiResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relativehumidity_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
  };
}

interface BvgStop {
  id: string;
  name: string;
  products: Record<string, boolean>;
}

interface BvgDeparture {
  tripId: string;
  direction: string;
  line: { name: string; product: string };
  when: string | null;
  plannedWhen: string;
  delay: number | null;
}

export function weatherDesc(code: number): string {
  if (code === 0) return "Klarer Himmel";
  if (code === 1) return "Überwiegend klar";
  if (code === 2) return "Teilweise bewölkt";
  if (code === 3) return "Bedeckt";
  if (code === 45 || code === 48) return "Nebel";
  if (code >= 51 && code <= 55) return "Nieselregen";
  if (code >= 61 && code <= 65) return "Regen";
  if (code >= 71 && code <= 77) return "Schneefall";
  if (code >= 80 && code <= 82) return "Regenschauer";
  if (code >= 85 && code <= 86) return "Schneeschauer";
  if (code >= 95 && code <= 99) return "Gewitter";
  return "Unbekannt";
}

export function weatherSymbol(code: number): string {
  if (code === 0) return "☀";
  if (code === 1) return "🌤";
  if (code === 2) return "⛅";
  if (code === 3) return "☁";
  if (code === 45 || code === 48) return "🌫";
  if (code >= 51 && code <= 55) return "🌦";
  if (code >= 61 && code <= 65) return "🌧";
  if (code >= 71 && code <= 77) return "❄";
  if (code >= 80 && code <= 82) return "🌧";
  if (code >= 85 && code <= 86) return "🌨";
  if (code >= 95) return "⛈";
  return "○";
}

export function lineBadgeCls(product: string): string {
  switch (product) {
    case "suburban":
      return "bg-[#009252] text-white";
    case "subway":
      return "bg-[#0067B3] text-white";
    case "tram":
      return "bg-[#BE1414] text-white";
    case "bus":
      return "bg-[#8B008B] text-white";
    case "regional":
      return "bg-[#6B2F86] text-white";
    case "ferry":
      return "bg-[#0071B3] text-white";
    default:
      return "bg-gray-700 text-white";
  }
}

export function minsUntil(isoOrNull: string | null): number {
  if (!isoOrNull) return 0;
  return Math.ceil((new Date(isoOrNull).getTime() - Date.now()) / 60_000);
}

export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86_400_000);
}

export function nearestHourIdx(times: string[]): number {
  const now = new Date();
  const hourStr = `${now.toISOString().substring(0, 13)}:00`;
  const exact = times.indexOf(hourStr);
  if (exact !== -1) return exact;
  let best = 0,
    bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - now.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  });
  return best;
}

export function useWeather() {
  return useQuery<WeatherApiResponse>({
    queryKey: ["weather-bru", SCHOOL_LAT, SCHOOL_LNG],
    queryFn: async () => {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(SCHOOL_LAT));
      url.searchParams.set("longitude", String(SCHOOL_LNG));
      url.searchParams.set("current_weather", "true");
      url.searchParams.set("hourly", "temperature_2m,relativehumidity_2m");
      url.searchParams.set(
        "daily",
        "temperature_2m_max,temperature_2m_min,weathercode",
      );
      url.searchParams.set("timezone", "Europe/Berlin");
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error(`Wetterdaten-Fehler: ${r.status}`);
      return r.json();
    },
    refetchInterval: 30 * 60 * 1_000,
  });
}

export function useTransport() {
  const [stop, setStop] = useState<BvgStop | null>(null);
  const [departures, setDepartures] = useState<BvgDeparture[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: nearby, isPending: isNearbyPending } = useQuery<BvgStop[]>({
    queryKey: ["bvg-nearby-bru", SCHOOL_LAT, SCHOOL_LNG],
    queryFn: async () => {
      const r = await fetch(
        `https://v6.bvg.transport.rest/locations/nearby?latitude=${SCHOOL_LAT}&longitude=${SCHOOL_LNG}&results=20`,
      );
      if (!r.ok) throw new Error(`BVG-Fehler: ${r.status}`);
      return r.json();
    },
    refetchInterval: 30 * 60 * 1_000,
  });

  useEffect(() => {
    if (nearby?.length) {
      setStop((prev) =>
        prev && nearby.some((s) => s.id === prev.id) ? prev : nearby[0],
      );
    }
  }, [nearby]);

  const fetchDeps = useCallback(async (stopId: string) => {
    setLoading(true);
    try {
      const r = await fetch(
        `https://v6.bvg.transport.rest/stops/${stopId}/departures?results=10&duration=60`,
      );
      if (!r.ok) throw new Error(`BVG-Abfahrten-Fehler: ${r.status}`);
      const d = await r.json();
      setDepartures(Array.isArray(d.departures) ? d.departures : []);
    } catch {
      setDepartures([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!stop?.id) return;
    fetchDeps(stop.id);
    const iv = setInterval(() => fetchDeps(stop.id), 3 * 60 * 1_000);
    return () => clearInterval(iv);
  }, [stop, fetchDeps]);

  return {
    stopName: stop?.name ?? "",
    departures,
    loading,
    initialLoaded: !isNearbyPending,
  };
}
