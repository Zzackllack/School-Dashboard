/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const [sBahnDepartures, setSBahnDepartures] = useState<Departure[]>([]);
  const [isLoadingStops, setIsLoadingStops] = useState(true);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [isLoadingSBahnDepartures, setIsLoadingSBahnDepartures] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sBahnError, setSBahnError] = useState<string | null>(null);
  const [currentStop, setCurrentStop] = useState<Stop | null>(null);
  const [currentSBahnStop, setCurrentSBahnStop] = useState<Stop | null>(null);
  const [activeTab, setActiveTab] = useState<'nearest' | 'sbahn'>('nearest');
  
  // School coordinates
  const schoolLat = 52.43432378391319;
  const schoolLng = 13.305375391277634;

  useEffect(() => {
    const fetchNearbyStops = async () => {
      setIsLoadingStops(true);
      try {
        const response = await fetch(`https://v6.bvg.transport.rest/locations/nearby?latitude=${schoolLat}&longitude=${schoolLng}&results=30`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: Stop[] = await response.json();
        console.log('Nearby stops:', data); // Debug log
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

    const fetchSBahnDepartures = async (stopId: string) => {
      setIsLoadingSBahnDepartures(true);
      try {
        console.log('Fetching S-Bahn departures for stop:', stopId); // Debug log
        const response = await fetch(`https://v6.bvg.transport.rest/stops/${stopId}/departures?results=10&duration=60&suburban=true`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data: DeparturesResponse = await response.json();
        console.log('S-Bahn departures data:', data); // Debug log
        
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
    return delay > 0 ? 'text-[#A45D5D]' : 'text-[#5E8C61]';
  };

  // Function to render a departure table
  const renderDepartureTable = (departures: Departure[], stop: Stop | null, isLoading: boolean, errorMsg: string | null) => {
    if (errorMsg) {
      return (
        <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 mb-4 rounded">
          {errorMsg}
        </div>
      );
    }

    if (!isLoading && departures.length === 0 && !errorMsg) {
      return (
        <div className="bg-[#F5EFD7] border border-[#DDB967] text-[#8C7356] px-4 py-3 rounded">
          No departures available at the moment.
        </div>
      );
    }

    return (
      <div className="w-full">
        {stop && (
          <div className="mb-3">
            <p className="text-[#3E3128]">
              <span className="font-semibold">Station: </span>
              {stop.name}
              {stop.distance && ` (${stop.distance}m from school)`}
            </p>
          </div>
        )}
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#5A4635] uppercase tracking-wider">Line</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#5A4635] uppercase tracking-wider">Direction</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#5A4635] uppercase tracking-wider">Departure</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-[#5A4635] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departures.map((departure, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F8F4E8]'}>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center h-6 w-12 rounded-md 
                      ${departure.line.product === 'bus' ? 'bg-[#F2E3C6] text-[#8C7356]' : 
                        departure.line.product === 'subway' ? 'bg-[#E8C897] text-[#8C7356]' :
                          departure.line.product === 'tram' ? 'bg-[#F5EFD7] text-[#8C7356]' :
                            departure.line.product === 'suburban' ? 'bg-[#DDB967] text-white' :
                              'bg-[#F8F4E8] text-[#5A4635]'
                      } font-semibold`}
                    >
                      {departure.line.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#3E3128]">{departure.direction}</td>
                  <td className="px-4 py-3 text-sm text-[#3E3128]">
                    {formatTime(departure.plannedWhen)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {departure.delay ? (
                      <span className={`${getDelayColorClass(departure.delay)}`}>
                        {getDelayText(departure.delay)}
                      </span>
                    ) : (
                      <span className="text-[#5E8C61]">On time</span>
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">
        Public Transportation
        {(isLoadingStops || isLoadingDepartures || isLoadingSBahnDepartures) && 
          <span className="ml-2 text-sm font-normal text-gray-500">(Loading...)</span>
        }
      </h2>

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'nearest' 
            ? 'text-[#8C7356] border-b-2 border-[#8C7356]' 
            : 'text-[#5A4635] hover:text-[#8C7356]'}`}
          onClick={() => setActiveTab('nearest')}
        >
          Nearest Station
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'sbahn' 
            ? 'text-[#8C7356] border-b-2 border-[#8C7356]' 
            : 'text-[#5A4635] hover:text-[#8C7356]'}`}
          onClick={() => setActiveTab('sbahn')}
        >
          S-Bahn
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'nearest' && renderDepartureTable(departures, currentStop, isLoadingDepartures, error)}
        {activeTab === 'sbahn' && renderDepartureTable(sBahnDepartures, currentSBahnStop, isLoadingSBahnDepartures, sBahnError)}
      </div>
      
      <div className="mt-4 text-xs text-[#5A4635]">
        <p>Data provided by BVG transport API - Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

export default Transportation;