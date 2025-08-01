import { useState, useEffect, useCallback } from 'react';

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

const Transportation = () => {
  const [, setNearbyStops] = useState<Stop[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [sBahnDepartures, setSBahnDepartures] = useState<Departure[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [isLoadingSBahnDepartures, setIsLoadingSBahnDepartures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sBahnError, setSBahnError] = useState<string | null>(null);
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [currentSBahnStop, setCurrentSBahnStop] = useState<Stop | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // School coordinates
  const schoolLat = 52.43432378391319;
  const schoolLng = 13.305375391277634;

  // Create fetchDepartures as a useCallback function so it can be used in useEffect and in the interval
  const fetchDepartures = useCallback(async (stopId: string) => {
    setIsLoadingDepartures(true);
    try {
      console.log('Fetching departures for stop:', stopId);
      const response = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}/departures?results=30&duration=60`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data: DeparturesResponse = await response.json();
      
      // Check if data has the expected structure
      if (!data.departures || !Array.isArray(data.departures)) {
        throw new Error('Unexpected API response format');
      }
      
      setDepartures(data.departures);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch departures:', err);
      setError('Problem beim Laden der Abfahrten. Bitte später erneut versuchen, oder Cédric kontaktieren.');
    } finally {
      setIsLoadingDepartures(false);
    }
  }, []);

  // Create fetchSBahnDepartures as a useCallback function
  const fetchSBahnDepartures = useCallback(async (stopId: string) => {
    setIsLoadingSBahnDepartures(true);
    try {
      console.log('Fetching S-Bahn departures for stop:', stopId);
      const response = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}/departures?results=30&duration=60&suburban=true`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data: DeparturesResponse = await response.json();
      
      // Check if data has the expected structure
      if (!data.departures || !Array.isArray(data.departures)) {
        throw new Error('Unexpected API response format');
      }
      
      // Filter to only show S-Bahn trains
      const filteredDepartures = data.departures.filter(dep => dep.line.product === 'suburban');
      setSBahnDepartures(filteredDepartures);
      setSBahnError(null);
    } catch (err) {
      console.error('Failed to fetch S-Bahn departures:', err);
      setSBahnError('Failed to load S-Bahn departures. Please try again later.');
    } finally {
      setIsLoadingSBahnDepartures(false);
    }
  }, []);

  // Create a function to update all data
  const updateAllData = useCallback(() => {
    if (currentStop) {
      fetchDepartures(currentStop.id);
    }
    if (currentSBahnStop) {
      fetchSBahnDepartures(currentSBahnStop.id);
    }
    setLastUpdated(new Date());
    console.log('Transportation data updated at', new Date().toLocaleTimeString());
  }, [currentStop, currentSBahnStop, fetchDepartures, fetchSBahnDepartures]);

  // Initial data fetch
  useEffect(() => {
    const fetchNearbyStops = async () => {
      setIsLoadingStops(true);
      try {
        const response = await fetch(`https://v6.bvg.transport.rest/locations/nearby?latitude=${schoolLat}&longitude=${schoolLng}&results=30`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Stop[] = await response.json();
        setNearbyStops(data);
        
        // Set nearest stop (regardless of type)
        if (data.length > 0) {
          setCurrentStop(data[0]);
          fetchDepartures(data[0].id);
        } else {
          throw new Error('No stops found near the school location.');
        }
        
        // Find nearest S-Bahn station
        const nearestSBahnStop = data.find(stop => stop.products.suburban === true);
        if (nearestSBahnStop) {
          setCurrentSBahnStop(nearestSBahnStop);
          fetchSBahnDepartures(nearestSBahnStop.id);
        } else {
          setSBahnError('No S-Bahn stations found nearby.');
        }
      } catch (err) {
        console.error('Failed to fetch nearby stops:', err);
        setError('Failed to load nearby stops. Please try again later.');
      } finally {
        setIsLoadingStops(false);
        setLastUpdated(new Date());
      }
    };

    fetchNearbyStops();
  }, [fetchDepartures, fetchSBahnDepartures]);

  // Set up automatic refresh every 3 minutes
  useEffect(() => {
    // Update data every 3 minutes (180000 ms)
    const intervalId = setInterval(() => {
      updateAllData();
    }, 180000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [updateAllData]);

  // Format time to display only hours and minutes
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get delay in minutes and format it
  const getDelayText = (delay: number | null) => {
    if (!delay) return null;
    
    const minutes = Math.floor(delay / 60);
    if (minutes === 0) return null;
    
    return minutes > 0 
      ? `+${minutes} min` 
      : `${minutes} min`;
  };

  // Get appropriate color class for delay text
  const getDelayColorClass = (delay: number | null) => {
    if (!delay) return '';
    // Use more vivid colors and bold font for delays
    return delay > 0 
      ? 'text-[#E30613] font-bold' // More vivid red for late
      : 'text-[#009933] font-bold'; // More vivid green for early
  };

  // Function to render a departure table
  const renderDepartureTable = (departures: Departure[], stop: Stop | null, isLoading: boolean, errorMsg: string | null, title: string) => {
    if (isLoading) {
      return (
        <div className="w-full mb-4">
          <h3 className="text-lg font-semibold text-[#3E3128] mb-2">{title}</h3>
          <div className="p-4 text-center">
            <p>Lade Abfahrten...</p>
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-lg">Linie</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Richtung</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Abfahrt</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {limitedDepartures.map((departure, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/80'} backdrop-blur-sm`}>
                  <td className="px-4 py-3 border-b border-gray-100/30">
                    <span className={`inline-flex items-center justify-center h-6 w-12 rounded-md 
                      ${departure.line.product === 'bus' ? 'bg-[#a3007c] text-white' : 
                        departure.line.product === 'subway' ? 'bg-[#E8C897] text-[#8C7356]' :
                          departure.line.product === 'tram' ? 'bg-[#F5EFD7] text-[#8C7356]' :
                            departure.line.product === 'suburban' ? 'bg-[#008D4F] text-white' :
                              'bg-[#F8F4E8] text-[#5A4635]'
                      } font-semibold`}
                    >
                      {departure.line.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#3E3128] border-b border-gray-100/30">{departure.direction}</td>
                  <td className="px-4 py-3 text-sm text-[#3E3128] border-b border-gray-100/30">
                    {formatTime(departure.plannedWhen)}
                  </td>
                  <td className="px-4 py-3 text-sm border-b border-gray-100/30">
                    {departure.delay ? (
                      <span className={`${getDelayColorClass(departure.delay)}`}>
                        {getDelayText(departure.delay)}
                      </span>
                    ) : (
                      <><span className="text-[#5E8C61]">Pünktlich</span></>
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
        {(isLoadingStops || isLoadingDepartures || isLoadingSBahnDepartures) && 
          <span className="ml-2 text-sm font-normal text-gray-500">(Ladevorgang...)</span>
        }
      </h2>

      {/* Content area */}
      <div>
        {/* Nearest station departures */}
        {renderDepartureTable(departures, currentStop, isLoadingDepartures, error, "Nächster Bahnhof")}
        
        {/* S-Bahn departures */}
        {renderDepartureTable(sBahnDepartures, currentSBahnStop, isLoadingSBahnDepartures, sBahnError, "S-Bahn Station")}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Es wird keine Haftung für die Richtigkeit übernommen, Daten bereitgestellt von <code className="bg-gray-100/80 px-1 rounded">v6.bvg.transport.rest</code> - Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default Transportation;