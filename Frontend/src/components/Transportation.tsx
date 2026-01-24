import { useState, useEffect, useCallback } from 'react';

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

const Transportation = () => {
  const [, setNearbyStops] = useState<Stop[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [sBahnDepartures, setSBahnDepartures] = useState<Departure[]>([]);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [isLoadingSBahnDepartures, setIsLoadingSBahnDepartures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sBahnError, setSBahnError] = useState<string | null>(null);
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [currentSBahnStop, setCurrentSBahnStop] = useState<Stop | null>(null);
  const [showFirstTable, setShowFirstTable] = useState(true);

  const schoolLat = 52.43432378391319;
  const schoolLng = 13.305375391277634;

  const fetchDepartures = useCallback(async (stopId: string) => {
    setIsLoadingDepartures(true);
    try {
      const response = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}/departures?results=30&duration=60`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data: DeparturesResponse = await response.json();

      if (!data.departures || !Array.isArray(data.departures)) {
        throw new Error('Unexpected API response format');
      }

      setDepartures(data.departures);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch departures:', err);
      setError('Fehler beim Laden der Abfahrten');
    } finally {
      setIsLoadingDepartures(false);
    }
  }, []);

  const fetchSBahnDepartures = useCallback(async (stopId: string) => {
    setIsLoadingSBahnDepartures(true);
    try {
      const response = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}/departures?results=30&duration=60&suburban=true`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data: DeparturesResponse = await response.json();

      if (!data.departures || !Array.isArray(data.departures)) {
        throw new Error('Unexpected API response format');
      }

      const filteredDepartures = data.departures.filter(dep => dep.line.product === 'suburban');
      setSBahnDepartures(filteredDepartures);
      setSBahnError(null);
    } catch (err) {
      console.error('Failed to fetch S-Bahn departures:', err);
      setSBahnError('Fehler beim Laden der S-Bahn Abfahrten');
    } finally {
      setIsLoadingSBahnDepartures(false);
    }
  }, []);

  const updateAllData = useCallback(() => {
    if (currentStop) {
      fetchDepartures(currentStop.id);
    }
    if (currentSBahnStop) {
      fetchSBahnDepartures(currentSBahnStop.id);
    }
  }, [currentStop, currentSBahnStop, fetchDepartures, fetchSBahnDepartures]);

  useEffect(() => {
    const fetchNearbyStops = async () => {
      try {
        const response = await fetch(`https://v6.bvg.transport.rest/locations/nearby?latitude=${schoolLat}&longitude=${schoolLng}&results=30`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Stop[] = await response.json();
        setNearbyStops(data);

        if (data.length > 0) {
          setCurrentStop(data[0]);
          fetchDepartures(data[0].id);
        } else {
          throw new Error('No stops found near the school location.');
        }

        const nearestSBahnStop = data.find(stop => stop.products.suburban === true);
        if (nearestSBahnStop) {
          setCurrentSBahnStop(nearestSBahnStop);
          fetchSBahnDepartures(nearestSBahnStop.id);
        } else {
          setSBahnError('Keine S-Bahn Station gefunden');
        }
      } catch (err) {
        console.error('Failed to fetch nearby stops:', err);
        setError('Fehler beim Laden der Haltestellen');
      }
    };

    fetchNearbyStops();
  }, [fetchDepartures, fetchSBahnDepartures]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateAllData();
    }, 180000);

    return () => clearInterval(intervalId);
  }, [updateAllData]);

  useEffect(() => {
    const toggleInterval = setInterval(() => {
      setShowFirstTable(prev => !prev);
    }, 16000);

    return () => clearInterval(toggleInterval);
  }, []);

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDelayText = (delay: number | null) => {
    if (!delay) return null;
    const minutes = Math.floor(delay / 60);
    if (minutes === 0) return null;
    return minutes > 0 ? `+${minutes}` : `${minutes}`;
  };

  const getDelayColorClass = (delay: number | null) => {
    if (!delay) return '';
    return delay > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600 dark:text-green-400 font-bold';
  };

  const renderDepartureTable = (departures: Departure[], stop: Stop | null, isLoading: boolean, errorMsg: string | null) => {    if (isLoading) {
      return (
          <div className="flex justify-center items-center h-full">
            <p className="text-4xl text-gray-700 dark:text-gray-300">Lade Abfahrten...</p>
          </div>
      );
    }

    if (errorMsg) {
      return (
          <div className="flex justify-center items-center h-full">
            <div className="bg-red-100/80 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 px-8 py-6 rounded-xl text-3xl">
              {errorMsg}
            </div>
          </div>
      );
    }

    if (departures.length === 0) {
      return (
          <div className="flex justify-center items-center h-full">
            <div className="bg-yellow-100/80 dark:bg-yellow-900/40 border-2 border-yellow-400 dark:border-yellow-600 text-yellow-900 dark:text-yellow-200 px-8 py-6 rounded-xl text-3xl">
              Keine Abfahrten verfügbar
            </div>
          </div>
      );
    }

    const limitedDepartures = departures.slice(0, 6);

    return (
        <div className="h-full flex flex-col">

          <div className="flex-1 overflow-hidden rounded-xl">
            <table className="min-w-full border-collapse h-full">
              <thead>
              <tr className="bg-gray-700/90 dark:bg-gray-800/90 text-white backdrop-blur-sm">
                <th className="px-6 py-5 text-left text-2xl font-semibold">Linie</th>
                <th className="px-6 py-5 text-left text-2xl font-semibold">Richtung</th>
                <th className="px-6 py-5 text-left text-2xl font-semibold">Abfahrt</th>
                <th className="px-6 py-5 text-left text-2xl font-semibold">Status</th>
              </tr>
              </thead>
              <tbody>
              {limitedDepartures.map((departure, index) => (
                  <tr key={index} className={`${index % 2 === 0 ? 'bg-white/60 dark:bg-gray-700/60' : 'bg-gray-50/60 dark:bg-gray-600/60'} backdrop-blur-sm`}>
                    <td className="px-6 py-5 border-b border-gray-200/30 dark:border-gray-600/30">
                    <span className={`inline-flex items-center justify-center h-12 px-5 rounded-lg text-2xl font-bold
                      ${departure.line.product === 'bus' ? 'bg-purple-700 text-white' :
                        departure.line.product === 'subway' ? 'bg-blue-600 text-white' :
                            departure.line.product === 'tram' ? 'bg-red-600 text-white' :
                                departure.line.product === 'suburban' ? 'bg-green-600 text-white' :
                                    'bg-gray-600 text-white'
                    }`}
                    >
                      {departure.line.name}
                    </span>
                    </td>
                    <td className="px-6 py-5 text-2xl text-gray-900 dark:text-white border-b border-gray-200/30 dark:border-gray-600/30">{departure.direction}</td>
                    <td className="px-6 py-5 text-2xl text-gray-900 dark:text-white border-b border-gray-200/30 dark:border-gray-600/30">
                      {formatTime(departure.plannedWhen)}
                    </td>
                    <td className="px-6 py-5 text-2xl border-b border-gray-200/30 dark:border-gray-600/30">
                      {departure.delay ? (
                          <span className={getDelayColorClass(departure.delay)}>
                        {getDelayText(departure.delay)}
                      </span>
                      ) : (
                          <span className="text-green-600 dark:text-green-400 font-semibold">●</span>
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
      <div className="h-full">
        {showFirstTable ? (
            renderDepartureTable(departures, currentStop, isLoadingDepartures, error)
        ) : (
            renderDepartureTable(sBahnDepartures, currentSBahnStop, isLoadingSBahnDepartures, sBahnError)
        )}
      </div>
  );
};

export default Transportation;