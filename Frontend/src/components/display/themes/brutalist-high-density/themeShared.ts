import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "#/lib/api/http";
import { TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS } from "#/lib/transport";

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

interface TransportStreamState {
  stopName: string;
  departures: BvgDeparture[];
  loading: boolean;
  error: string | null;
}

export function resolveTransportStops(nearby: BvgStop[]) {
  if (nearby.length === 0) {
    return {
      busStop: null,
      sBahnStop: null,
    };
  }

  return {
    busStop: nearby.find((s) => s.products.bus) ?? nearby[0],
    sBahnStop: nearby.find((s) => s.products.suburban) ?? null,
  };
}

export function buildDeparturesUrl(
  stopId: string,
  options?: {
    suburbanOnly?: boolean;
  },
) {
  const params = new URLSearchParams({
    results: "30",
    duration: "60",
  });
  if (options?.suburbanOnly) {
    params.set("suburban", "true");
  }

  return `/api/transport/stops/${stopId}/departures?${params.toString()}`;
}

export function buildNearbyStopsUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    results: "30",
  });

  return `/api/transport/stops/nearby?${params.toString()}`;
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
  const [busStop, setBusStop] = useState<BvgStop | null>(null);
  const [sBahnStop, setSBahnStop] = useState<BvgStop | null>(null);
  const [busDepartures, setBusDepartures] = useState<BvgDeparture[]>([]);
  const [sBahnDepartures, setSBahnDepartures] = useState<BvgDeparture[]>([]);
  const [isBusLoading, setIsBusLoading] = useState(false);
  const [isSBahnLoading, setIsSBahnLoading] = useState(false);
  const [busError, setBusError] = useState<string | null>(null);
  const [sBahnError, setSBahnError] = useState<string | null>(null);

  const {
    data: nearby,
    isPending: isNearbyPending,
    error: nearbyStopsError,
  } = useQuery<BvgStop[]>({
    queryKey: ["bvg-nearby-bru", SCHOOL_LAT, SCHOOL_LNG],
    queryFn: async () => {
      const url = buildNearbyStopsUrl(SCHOOL_LAT, SCHOOL_LNG);
      console.info("[transport] fetching nearby stops", { url });
      const stops = await fetchJson<BvgStop[]>(url);
      console.info("[transport] nearby stops loaded", {
        url,
        count: stops?.length ?? 0,
      });
      return stops ?? [];
    },
    refetchInterval: 30 * 60 * 1_000,
  });

  useEffect(() => {
    if (nearbyStopsError) {
      console.error("[transport] nearby stops failed", nearbyStopsError);
    }

    if (!nearby?.length) {
      setBusStop(null);
      setSBahnStop(null);
      return;
    }

    const { busStop: nearestBusStop, sBahnStop: nearestSBahnStop } =
      resolveTransportStops(nearby);

    setBusStop((prev) =>
      nearestBusStop && prev?.id === nearestBusStop.id ? prev : nearestBusStop,
    );
    setSBahnStop((prev) =>
      nearestSBahnStop && prev?.id === nearestSBahnStop.id
        ? prev
        : nearestSBahnStop,
    );
    console.info("[transport] resolved nearest stops", {
      busStopId: nearestBusStop?.id ?? null,
      busStopName: nearestBusStop?.name ?? null,
      sBahnStopId: nearestSBahnStop?.id ?? null,
      sBahnStopName: nearestSBahnStop?.name ?? null,
    });
  }, [nearby, nearbyStopsError]);

  const fetchDeps = useCallback(
    async (
      stopId: string,
      setDepartures: (departures: BvgDeparture[]) => void,
      setLoading: (loading: boolean) => void,
      options?: {
        product?: string;
        suburbanOnly?: boolean;
      },
    ) => {
      setLoading(true);
      try {
        const url = buildDeparturesUrl(stopId, {
          suburbanOnly: options?.suburbanOnly,
        });
        console.info("[transport] fetching departures", {
          stopId,
          product: options?.product ?? null,
          url,
        });
        const d = (await fetchJson<{ departures?: BvgDeparture[] }>(url)) ?? {};
        const departures = Array.isArray(d.departures) ? d.departures : [];
        console.info("[transport] departures loaded", {
          stopId,
          product: options?.product ?? null,
          count: departures.length,
        });
        setDepartures(
          options?.product
            ? departures.filter(
                (departure: BvgDeparture) =>
                  departure.line.product === options.product,
              )
            : departures,
        );
        if (options?.product === "bus") {
          setBusError(null);
        } else if (options?.product === "suburban") {
          setSBahnError(null);
        }
      } catch (error) {
        console.warn(
          "Keeping previous departures after transport refresh error",
          {
            stopId,
            product: options?.product ?? null,
            error,
          },
        );
        const message = `Abfahrten konnten nicht aktualisiert werden (${options?.product ?? "unknown"}).`;
        if (options?.product === "bus") {
          setBusError(message);
        } else if (options?.product === "suburban") {
          setSBahnError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!busStop?.id) return;
    fetchDeps(
      busStop.id,
      (departures) =>
        setBusDepartures(
          departures.filter((departure) => departure.line.product === "bus"),
        ),
      setIsBusLoading,
      { product: "bus" },
    );
    const iv = setInterval(
      () =>
        fetchDeps(
          busStop.id,
          (departures) =>
            setBusDepartures(
              departures.filter(
                (departure) => departure.line.product === "bus",
              ),
            ),
          setIsBusLoading,
          { product: "bus" },
        ),
      TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(iv);
  }, [busStop, fetchDeps]);

  useEffect(() => {
    if (!sBahnStop?.id) return;
    fetchDeps(sBahnStop.id, setSBahnDepartures, setIsSBahnLoading, {
      product: "suburban",
      suburbanOnly: true,
    });
    const iv = setInterval(
      () =>
        fetchDeps(sBahnStop.id, setSBahnDepartures, setIsSBahnLoading, {
          product: "suburban",
          suburbanOnly: true,
        }),
      TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS,
    );
    return () => clearInterval(iv);
  }, [sBahnStop, fetchDeps]);

  const bus: TransportStreamState = {
    stopName: busStop?.name ?? "",
    departures: busDepartures,
    loading: isBusLoading,
    error: busError,
  };

  const sBahn: TransportStreamState = {
    stopName: sBahnStop?.name ?? "",
    departures: sBahnDepartures,
    loading: isSBahnLoading,
    error: sBahnError,
  };

  const nearbyErrorMessage = nearbyStopsError
    ? "Haltestellen konnten nicht geladen werden."
    : null;

  return {
    bus,
    sBahn,
    loading: isBusLoading || isSBahnLoading,
    initialLoaded: !isNearbyPending,
    error: nearbyErrorMessage ?? busError ?? sBahnError,
  };
}
