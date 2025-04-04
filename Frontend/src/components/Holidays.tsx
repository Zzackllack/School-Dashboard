import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import holidaysData from '../data/holidays.json';

// Define TypeScript interface for Holiday data
interface Holiday {
  name: string;
  start: string;
  end: string;
  type: string;
}

interface HolidaysData {
  [key: string]: Holiday[];
}

const Holidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadHolidays = () => {
      setLoading(true);
      try {
        // Get current year 
        const currentYear = new Date().getFullYear();
        const typedHolidaysData = holidaysData as HolidaysData;
        
        // Get holidays for current year, and possibly next year
        const currentYearStr = currentYear.toString();
        const nextYearStr = (currentYear + 1).toString();
        
        let allRelevantHolidays: Holiday[] = [];
        
        // Add current year holidays if available
        if (typedHolidaysData[currentYearStr]) {
          allRelevantHolidays = [...typedHolidaysData[currentYearStr]];
        }
        
        // Add next year holidays if available
        if (typedHolidaysData[nextYearStr]) {
          allRelevantHolidays = [...allRelevantHolidays, ...typedHolidaysData[nextYearStr]];
        }
        
        // Filter to only show upcoming holidays
        const currentDate = new Date();
        const upcomingHolidays = allRelevantHolidays.filter(holiday => {
          // Skip entries with empty dates
          if (!holiday.end) return false;
          return new Date(holiday.end) >= currentDate;
        });
        
        // Sort holidays by start date
        upcomingHolidays.sort((a, b) => {
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        });
        
        setHolidays(upcomingHolidays);
        setError(null);
      } catch (err) {
        console.error('Failed to load holidays data:', err);
        setError('Fehler beim Laden der Feriendaten. Bitte kontaktiere Cédric.');
      } finally {
        setLoading(false);
      }
    };
    
    loadHolidays();
  }, []);
  
  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Format holiday name to be more user-friendly
  const formatHolidayName = (name: string) => {
    // Remove location information if present (like "berlin" at the end)
    const formattedName = name.replace(/\s+berlin$/i, '').trim();
    
    // Convert the first letter to uppercase and the rest remains lowercase
    return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
  };
  
  // Calculate days until holiday starts
  const calculateDaysUntil = (startDateString: string) => {
    if (!startDateString) return '';
    
    const startDate = new Date(startDateString);
    const currentDate = new Date();
    
    // Set both dates to midnight for accurate day count
    currentDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const timeDiff = startDate.getTime() - currentDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff < 0) return "Bereits begonnen";
    if (dayDiff === 0) return "Heute";
    if (dayDiff === 1) return "Beginnen morgen";
    return `In ${dayDiff} Tagen`;
  };
  
  // Get highlight class based on event type
  const getEventHighlightClass = (type: string) => {
    switch(type.toLowerCase()) {
      case 'ferien':
        return 'bg-[#F5EFD7]/50 border-[#DDB967]';
      case 'feiertag':
        return 'bg-blue-50/50 border-blue-200';
      case 'unterrichtsfrei':
        return 'bg-green-50/50 border-green-200';
      default:
        return 'bg-white border-gray-200';
    }
  };
  
  // Get icon color based on event type
  const getEventIconColor = (type: string, isFirst: boolean) => {
    if (isFirst) return 'text-[#8C7356]';
    
    switch(type.toLowerCase()) {
      case 'ferien':
        return 'text-[#DDB967]';
      case 'feiertag':
        return 'text-blue-500';
      case 'unterrichtsfrei':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center w-full">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Nächste Schulferien</h2>
        <div className="flex justify-center items-center h-40">
          <p>Feriendaten werden geladen...</p>
        </div>
      </div>
    );
  }
  
  if (error || holidays.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center w-full">
        <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Nächste Schulferien</h2>
        <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 rounded">
          {error || 'Keine Feriendaten verfügbar.'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Nächste Schulferien</h2>
      
      <div className="space-y-4">
        {holidays.slice(0, 4).map((holiday, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${getEventHighlightClass(holiday.type)}`}
          >
            <div className="flex items-start">
              <Calendar size={24} className={`mr-3 mt-1 ${getEventIconColor(holiday.type, index === 0)}`} />
              <div>
                <h3 className="font-semibold text-[#3E3128]">
                  {formatHolidayName(holiday.name)}
                  <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {holiday.type}
                  </span>
                </h3>
                <p className="text-[#5A4635]">
                  {formatDate(holiday.start)} - {formatDate(holiday.end)}
                </p>
                <p className={`text-sm font-medium ${index === 0 ? 'text-[#8C7356]' : 'text-gray-500'} mt-1`}>
                  {calculateDaysUntil(holiday.start)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Es wird keine Haftung für die Richtigkeit übernommen. Daten bereitgestellt von der Senatsverwaltung für Bildung, Jugend und Familie Berlin.</p>
      </div>
    </div>
  );
};

export default Holidays;
