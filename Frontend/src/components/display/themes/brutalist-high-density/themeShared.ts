import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
  const {
    data: nearby,
    isPending: isNearbyPending,
    error: nearbyStopsError,
  } = useQuery<BvgStop[]>({
    queryKey: ["bvg-nearby-bru", SCHOOL_LAT, SCHOOL_LNG],
    queryFn: async () => {
      const url = buildNearbyStopsUrl(SCHOOL_LAT, SCHOOL_LNG);
      console.info("[transport] fetching nearby stops", { url });
      try {
        const stops = await fetchJson<BvgStop[]>(url);
        console.info("[transport] nearby stops loaded", {
          url,
          count: stops?.length ?? 0,
        });
        return stops ?? [];
      } catch (error) {
        // Logged here rather than from an effect: this used to be a separate
        // effect that only existed to observe the error, and it re-ran on every
        // nearby refetch.
        console.error("[transport] nearby stops failed", { url, error });
        throw error;
      }
    },
    refetchInterval: 30 * 60 * 1_000,
  });

  // Derived from the nearby query instead of mirrored into state by an effect.
  // The effect version also could not clear itself, so a stop that went away
  // left the previous one selected until some later fetch replaced it.
  const { busStop, sBahnStop } = useMemo(() => {
    const resolved = resolveTransportStops(nearby ?? []);
    if (nearby?.length) {
      console.info("[transport] resolved nearest stops", {
        busStopId: resolved.busStop?.id ?? null,
        busStopName: resolved.busStop?.name ?? null,
        sBahnStopId: resolved.sBahnStop?.id ?? null,
        sBahnStopName: resolved.sBahnStop?.name ?? null,
      });
    }
    return resolved;
  }, [nearby]);

  // `isLoading` (isPending && isFetching), not `isPending`: a query disabled via
  // `enabled` with no stop to resolve stays pending forever, so `isPending`
  // latched the module into its loading branch whenever no stop was found, and
  // swallowed the nearby-stops error that branch is supposed to fall through to.
  const {
    data: busDeparturesResponse,
    isLoading: isBusLoading,
    isError: isBusError,
  } = useQuery<{ departures?: BvgDeparture[] }>({
    queryKey: ["bvg-departures-bus", busStop?.id],
    queryFn: async () => {
      if (!busStop) throw new Error("no bus stop selected");
      const url = buildDeparturesUrl(busStop.id, { suburbanOnly: false });
      console.info("[transport] fetching departures", {
        stopId: busStop.id,
        product: "bus",
        url,
      });
      const d = (await fetchJson<{ departures?: BvgDeparture[] }>(url)) ?? {};
      console.info("[transport] departures loaded", {
        stopId: busStop?.id,
        product: "bus",
        count: d.departures?.length ?? 0,
      });
      return d;
    },
    enabled: busStop !== null,
    // Replaces a setInterval effect plus a second effect keyed on the stop.
    refetchInterval: TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS,
  });

  const {
    data: sBahnDeparturesResponse,
    isLoading: isSBahnLoading,
    isError: isSBahnError,
  } = useQuery<{ departures?: BvgDeparture[] }>({
    queryKey: ["bvg-departures-sbahn", sBahnStop?.id],
    queryFn: async () => {
      if (!sBahnStop) throw new Error("no S-Bahn stop selected");
      const url = buildDeparturesUrl(sBahnStop.id, { suburbanOnly: true });
      console.info("[transport] fetching departures", {
        stopId: sBahnStop.id,
        product: "suburban",
        url,
      });
      const d = (await fetchJson<{ departures?: BvgDeparture[] }>(url)) ?? {};
      console.info("[transport] departures loaded", {
        stopId: sBahnStop?.id,
        product: "suburban",
        count: d.departures?.length ?? 0,
      });
      return d;
    },
    enabled: sBahnStop !== null,
    refetchInterval: TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS,
  });

  const busDepartures = useMemo(
    () =>
      (busDeparturesResponse?.departures ?? []).filter(
        (departure) => departure.line.product === "bus",
      ),
    [busDeparturesResponse],
  );

  const sBahnDepartures = sBahnDeparturesResponse?.departures ?? [];

  // User-facing strings are unchanged; only their source moved off setState.
  const busError = isBusError
    ? "Abfahrten konnten nicht aktualisiert werden (bus)."
    : null;
  const sBahnError = isSBahnError
    ? "Abfahrten konnten nicht aktualisiert werden (suburban)."
    : null;

  // Side effect of using isLoading: a background refetch no longer flips the
  // loading indicator, which the old setInterval version did.
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
