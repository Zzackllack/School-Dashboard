import { useState, useEffect } from 'react';

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

// Add this new interface for the departures response
interface DeparturesResponse {
  departures: Departure[];
  realtimeDataUpdatedAt?: number;
}

const Transportation = () => {
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  
  // School coordinates
  const schoolLat = 52.43432378391319;
  const schoolLng = 13.305375391277634;

  useEffect(() => {
    const fetchNearbyStops = async () => {
      setIsLoadingStops(true);
      try {
        const response = await fetch(`https://v6.bvg.transport.rest/locations/nearby?latitude=${schoolLat}&longitude=${schoolLng}&results=5`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Stop[] = await response.json();
        console.log('Nearby stops:', data); // Debug log
        setNearbyStops(data);
        
        // After getting nearby stops, fetch departures for the closest one
        if (data.length > 0) {
          setCurrentStop(data[0]);
          fetchDepartures(data[0].id);
        } else {
          throw new Error('No stops found near the school location.');
        }
      } catch (err) {
        console.error('Failed to fetch nearby stops:', err);
        setError('Failed to load nearby stops. Please try again later.');
      } finally {
        setIsLoadingStops(false);
      }
    };

    const fetchDepartures = async (stopId: string) => {
      setIsLoadingDepartures(true);
      try {
        console.log('Fetching departures for stop:', stopId); // Debug log
        const response = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}/departures?results=10&duration=60`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: DeparturesResponse = await response.json();
        console.log('Departures data:', data); // Debug log
        
        // Check if data has the expected structure
        if (!data.departures || !Array.isArray(data.departures)) {
          throw new Error('Unexpected API response format');
        }
        
        setDepartures(data.departures);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch departures:', err);
        setError('Failed to load departures. Please try again later.');
      } finally {
        setIsLoadingDepartures(false);
      }
    };

    fetchNearbyStops();
  }, []);

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
    return delay > 0 ? 'text-red-600' : 'text-green-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h2 className="text-xl font-bold text-blue-500 border-b border-gray-200 pb-2 mb-4">
        Public Transportation
        {(isLoadingStops || isLoadingDepartures) && <span className="ml-2 text-sm font-normal text-gray-500">(Loading...)</span>}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}

      {!isLoadingStops && !isLoadingDepartures && departures.length === 0 && !error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No departures available at the moment.
        </div>
      )}

      {departures.length > 0 && (
        <div>
          <div className="mb-3">
            <p className="text-gray-700">
              <span className="font-semibold">Station: </span>
              {currentStop?.name || departures[0]?.stop?.name}
              {currentStop?.distance && ` (${currentStop.distance}m from school)`}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departures.map((departure, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center h-6 w-12 rounded-md 
                        ${departure.line.product === 'bus' ? 'bg-purple-100 text-purple-800' : 
                          departure.line.product === 'subway' ? 'bg-blue-100 text-blue-800' : 
                            departure.line.product === 'tram' ? 'bg-red-100 text-red-800' : 
                              departure.line.product === 'suburban' ? 'bg-green-100 text-green-800' : 
                                'bg-gray-100 text-gray-800'
                        } font-semibold`}
                      >
                        {departure.line.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{departure.direction}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatTime(departure.plannedWhen)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {departure.delay ? (
                        <span className={`${getDelayColorClass(departure.delay)}`}>
                          {getDelayText(departure.delay)}
                        </span>
                      ) : (
                        <span className="text-green-600">On time</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>Data provided by BVG transport API - Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transportation;