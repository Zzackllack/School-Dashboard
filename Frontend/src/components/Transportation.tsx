import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "#/lib/api/http";
import { TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS } from "#/lib/transport";

// Define interfaces for API responses
interface Stop {
  type: string;
  id: string;
  name: string;
  location: {
    type: string;
    id: string;
    latitude: number;
    longitude: number;
  };
  products: {
    suburban: boolean;
    subway: boolean;
    tram: boolean;
    bus: boolean;
    ferry: boolean;
    express: boolean;
    regional: boolean;
  };
  distance?: number;
}

interface Line {
  type: string;
  id: string;
  name: string;
  mode: string;
  product: string;
}

interface Departure {
  tripId: string;
  direction: string;
  line: Line;
  when: string;
  plannedWhen: string;
  delay: number | null;
  platform: string | null;
  plannedPlatform: string | null;
  stop: Stop;
  remarks?: Array<{
    id: string;
    type: string;
    summary?: string;
    text: string;
  }>;
}

interface DeparturesResponse {
  departures: Departure[];
  realtimeDataUpdatedAt?: number;
}

const GERMAN_TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

const Transportation = () => {
  // School coordinates
  const schoolLat = 52.43432378391319;
  const schoolLng = 13.305375391277634;

  const nearbyStopsUrl = `/transport/stops/nearby?latitude=${schoolLat}&longitude=${schoolLng}&results=30`;
  const buildDeparturesApiPath = (stopId: string, suburbanOnly = false) => {
    const params = new URLSearchParams({
      results: "30",
      duration: "60",
    });
    if (suburbanOnly) {
      params.set("suburban", "true");
    }

    return `/transport/stops/${stopId}/departures?${params.toString()}`;
  };

  const {
    data: nearbyStops = [],
    isLoading: isLoadingStops,
    error: nearbyStopsError,
  } = useQuery<Stop[]>({
    queryKey: ["nearby-stops", schoolLat, schoolLng],
    queryFn: async () => (await fetchJson<Stop[]>(nearbyStopsUrl)) ?? [],
    refetchInterval: 30 * 60 * 1000,
  });

  // The nearest stops are derived from the nearby query rather than mirrored into
  // state by an effect. Besides the extra render per fetch, the effect version
  // could not clear itself: a "Failed to load nearby stops" message written on a
  // failed fetch survived a later successful refetch.
  const currentStop = useMemo(() => nearbyStops[0] ?? null, [nearbyStops]);

  const currentSBahnStop = useMemo(
    () => nearbyStops.find((stop) => stop.products.suburban === true) ?? null,
    [nearbyStops],
  );

  const nearbyStopsErrorMessage = nearbyStopsError
    ? "Failed to load nearby stops. Please try again later."
    : null;

  // Also derived: this used to be written into sBahnError by the same effect,
  // which meant it replaced genuine departure-fetch failures. Departure errors
  // now take precedence over it.
  //
  // Gated on the nearby query having settled: on the first render `nearbyStops`
  // is still the empty default, so an ungated version announced that no S-Bahn
  // stations exist before a single request had gone out.
  const missingSBahnStopMessage =
    currentSBahnStop || isLoadingStops || nearbyStopsError
      ? null
      : "No S-Bahn stations found nearby.";

  const {
    data: departuresResponse,
    isLoading: isLoadingDepartures,
    isError: isDeparturesError,
    dataUpdatedAt: departuresUpdatedAt,
  } = useQuery<DeparturesResponse>({
    queryKey: ["transport-departures", currentStop?.id],
    queryFn: async () => {
      // Narrowed instead of asserted: `enabled` already guarantees this, but
      // throwing keeps TypeScript honest if that guard is ever loosened.
      if (!currentStop) throw new Error("no bus stop selected");
      console.log("Fetching departures for stop:", currentStop.id);
      const data = (await fetchJson<DeparturesResponse>(
        buildDeparturesApiPath(currentStop.id),
      )) ?? { departures: [] };
      if (!data.departures || !Array.isArray(data.departures)) {
        throw new Error("Unexpected API response format");
      }
      return data;
    },
    enabled: currentStop !== null,
    // Refresh often enough to feel live without approaching the upstream API
    // rate limits. This replaces a setInterval effect plus a second effect that
    // refetched whenever the stop changed.
    refetchInterval: TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS,
  });

  const {
    data: sBahnDeparturesResponse,
    isLoading: isLoadingSBahnDepartures,
    isError: isSBahnError,
    dataUpdatedAt: sBahnUpdatedAt,
  } = useQuery<DeparturesResponse>({
    queryKey: ["transport-sbahn-departures", currentSBahnStop?.id],
    queryFn: async () => {
      if (!currentSBahnStop) throw new Error("no S-Bahn stop selected");
      console.log("Fetching S-Bahn departures for stop:", currentSBahnStop.id);
      const data = (await fetchJson<DeparturesResponse>(
        buildDeparturesApiPath(currentSBahnStop.id, true),
      )) ?? { departures: [] };
      if (!data.departures || !Array.isArray(data.departures)) {
        throw new Error("Unexpected API response format");
      }
      return data;
    },
    enabled: currentSBahnStop !== null,
    refetchInterval: TRANSPORT_DEPARTURES_REFRESH_INTERVAL_MS,
  });

  // Filter to only show S-Bahn trains.
  const departures = useMemo(
    () => departuresResponse?.departures ?? [],
    [departuresResponse],
  );
  const sBahnDepartures = useMemo(
    () =>
      (sBahnDeparturesResponse?.departures ?? []).filter(
        (dep: Departure) => dep.line.product === "suburban",
      ),
    [sBahnDeparturesResponse],
  );

  // User-facing strings stay exactly as they were; only their source changed.
  const departuresErrorMessage = isDeparturesError
    ? "Problem beim Laden der Abfahrten. Bitte später erneut versuchen, oder Cédric kontaktieren."
    : null;
  const sBahnErrorMessage = isSBahnError
    ? "Failed to load S-Bahn departures. Please try again later."
    : null;

  // Renders a dash until something has actually been fetched. Falling back to
  // `new Date()` produced a new timestamp on every render, so the footer showed
  // a running clock while claiming to be a "last updated" stamp.
  //
  // `dataUpdatedAt` is 0 rather than undefined before the first fetch, so a `??`
  // here never reached the S-Bahn timestamp; it just handed back 0. Math.max
  // picks the more recent of the two and still yields 0 when neither has data.
  const lastUpdatedTimestamp = Math.max(departuresUpdatedAt, sBahnUpdatedAt);
  const lastUpdatedText = lastUpdatedTimestamp
    ? new Date(lastUpdatedTimestamp).toLocaleTimeString(
        "de-DE",
        GERMAN_TIME_FORMAT_OPTIONS,
      )
    : "–";

  const isLoadingAnything =
    isLoadingStops || isLoadingDepartures || isLoadingSBahnDepartures;

  // Format time to display only hours and minutes
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("de-DE", GERMAN_TIME_FORMAT_OPTIONS);
  };

  // Get delay in minutes and format it
  const getDelayText = (delay: number | null) => {
    if (!delay) return null;

    const minutes = Math.floor(delay / 60);
    if (minutes === 0) return null;

    return minutes > 0 ? `+${minutes} min` : `${minutes} min`;
  };

  // Get appropriate color class for delay text
  const getDelayColorClass = (delay: number | null) => {
    if (!delay) return "";
    // Use more vivid colors and bold font for delays
    return delay > 0
      ? "text-[#E30613] font-bold" // More vivid red for late
      : "text-[#009933] font-bold"; // More vivid green for early
  };

  // Function to render a departure table
  const renderDepartureTable = (
    departures: Departure[],
    stop: Stop | null,
    isLoading: boolean,
    errorMsg: string | null,
    title: string,
  ) => {
    if (isLoading) {
      return (
        <div className="w-full mb-4">
          <h3 className="text-lg font-semibold text-[#3E3128] mb-2">{title}</h3>
          <div className="p-4 text-center">
            <p>Lade Abfahrten...</p>
          </div>
        </div>
      );
    }

    if (errorMsg) {
      return (
        <div className="w-full mb-4">
          <h3 className="text-lg font-semibold text-[#3E3128] mb-2">{title}</h3>
          <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        </div>
      );
    }

    // This line properly causes known issues in development environment (npm run dev) but works fine in production
    // I have no idea, but when "No departures available at the moment." is displayed, but you think there should be departures just remove or uncomment the if statement below
    // I think it has something to do with the way the data is fetched after the component is mounted but no idea
    if (departures.length === 0) {
      return (
        <div className="w-full mb-4">
          <h3 className="text-lg font-semibold text-[#3E3128] mb-2">{title}</h3>
          <div className="bg-[#F5EFD7] border border-[#DDB967] text-[#8C7356] px-4 py-3 rounded-lg">
            Momentan keine Abfahrten verfügbar.
          </div>
        </div>
      );
    }

    // Show only the next 4 departures
    const limitedDepartures = departures.slice(0, 4);

    return (
      <div className="w-full mb-6">
        <h3 className="text-lg font-semibold text-[#3E3128] mb-2">{title}</h3>
        {stop && (
          <div className="mb-3">
            <p className="text-[#3E3128]">
              <span className="font-semibold">Station: </span>
              {stop.name}
              {stop.distance && ` (${stop.distance}m entfernt)`}
            </p>
          </div>
        )}

        <div className="overflow-x-auto w-full rounded-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-700/90 text-white backdrop-blur-md">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">
                  Linie
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Richtung
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Abfahrt
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {limitedDepartures.map((departure, index) => (
                <tr
                  key={`${departure.tripId}-${departure.plannedWhen}`}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50/80"} backdrop-blur-sm`}
                >
                  <td className="px-4 py-3 border-b border-gray-100/30">
                    <span
                      className={`inline-flex items-center justify-center h-6 w-12 rounded-md 
                      ${
                        departure.line.product === "bus"
                          ? "bg-[#a3007c] text-white"
                          : departure.line.product === "subway"
                            ? "bg-[#E8C897] text-[#8C7356]"
                            : departure.line.product === "tram"
                              ? "bg-[#F5EFD7] text-[#8C7356]"
                              : departure.line.product === "suburban"
                                ? "bg-[#008D4F] text-white"
                                : "bg-[#F8F4E8] text-[#5A4635]"
                      } font-semibold`}
                    >
                      {departure.line.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#3E3128] border-b border-gray-100/30">
                    {departure.direction}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#3E3128] border-b border-gray-100/30">
                    {formatTime(departure.plannedWhen)}
                  </td>
                  <td className="px-4 py-3 text-sm border-b border-gray-100/30">
                    {departure.delay ? (
                      <span
                        className={`${getDelayColorClass(departure.delay)}`}
                      >
                        {getDelayText(departure.delay)}
                      </span>
                    ) : (
                      <>
                        <span className="text-[#5E8C61]">Pünktlich</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white backdrop-blur-md rounded-xl shadow-lg border border-white/20 p-5 mb-5 w-full transition-all duration-300">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
        Öffentliche Verkehrsmittel
        {isLoadingAnything && (
          <span className="ml-2 text-sm font-normal text-gray-500">
            (Ladevorgang...)
          </span>
        )}
      </h2>

      {/* Content area */}
      <div>
        {/* Nearest station departures */}
        {renderDepartureTable(
          departures,
          currentStop,
          isLoadingStops || isLoadingDepartures,
          departuresErrorMessage ?? nearbyStopsErrorMessage,
          "Nächster Bahnhof",
        )}

        {/* S-Bahn departures */}
        {renderDepartureTable(
          sBahnDepartures,
          currentSBahnStop,
          isLoadingStops || isLoadingSBahnDepartures,
          sBahnErrorMessage ?? missingSBahnStopMessage,
          "S-Bahn Station",
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>
          Es wird keine Haftung für die Richtigkeit übernommen, Daten
          bereitgestellt von{" "}
          <code className="bg-gray-100/80 px-1 rounded">
            v6.bvg.transport.rest
          </code>{" "}
          - Zuletzt aktualisiert: {lastUpdatedText}
        </p>
      </div>
    </div>
  );
};

export default Transportation;
