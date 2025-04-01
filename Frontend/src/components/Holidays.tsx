import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

// Define TypeScript interface for Holiday data from the API
interface Holiday {
  start: string;
  end: string;
  year: number;
  stateCode: string;
  name: string;
  slug: string;
}

const Holidays = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const berlinStateCode = 'BE'; // ISO code for Berlin
  
  useEffect(() => {
    const fetchHolidays = async () => {
      setLoading(true);
      try {
        // Get current year 
        const currentYear = new Date().getFullYear();
        
        // Fetch holiday data for Berlin for current year
        const response = await fetch(`https://ferien-api.de/api/v1/holidays/${berlinStateCode}/${currentYear}`);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data: Holiday[] = await response.json();
        
        // Filter to only show upcoming holidays
        const currentDate = new Date();
        const upcomingHolidays = data.filter(holiday => new Date(holiday.end) > currentDate);
        
        // Try to fetch next year's holidays if we don't have enough upcoming holidays
        if (upcomingHolidays.length < 3) {
          try {
            const nextYearResponse = await fetch(`https://ferien-api.de/api/v1/holidays/${berlinStateCode}/${currentYear + 1}`);
            if (nextYearResponse.ok) {
              const nextYearData: Holiday[] = await nextYearResponse.json();
              upcomingHolidays.push(...nextYearData);
            }
          } catch (err) {
            console.warn('Could not fetch next year holidays', err);
          }
        }
        
        setHolidays(upcomingHolidays);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch holidays data:', err);
        setError('Fehler beim Laden der Feriendaten. Bitte versuche es später erneut oder kontaktiere Cédric.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHolidays();
  }, []);
  
  // Format date from ISO string to readable format
  const formatDate = (dateString: string) => {
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
    return formattedName.charAt(0).toUpperCase() + formattedName.slice(1).toLowerCase();
  };
  
  // Calculate days until holiday starts
  const calculateDaysUntil = (startDateString: string) => {
    const startDate = new Date(startDateString);
    const currentDate = new Date();
    
    // Set both dates to midnight for accurate day count
    currentDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    
    const timeDiff = startDate.getTime() - currentDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (dayDiff <= 0) return "Bereits begonnen";
    if (dayDiff === 1) return "Beginnen morgen";
    return `In ${dayDiff} Tagen`;
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center w-full">
        <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Nächste Schulferien</h2>
        <div className="flex justify-center items-center h-40">
          <p>Feriendaten werden geladen...</p>
        </div>
      </div>
    );
  }
  
  if (error || holidays.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 text-center w-full">
        <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Nächste Schulferien</h2>
        <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 rounded">
          {error || 'Keine Feriendaten verfügbar.'}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-[#8C7356] border-b border-gray-200 pb-2 mb-4">Nächste Schulferien</h2>
      
      <div className="space-y-4">
        {holidays.slice(0, 3).map((holiday, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${index === 0 ? 'bg-[#F5EFD7]/50 border-[#DDB967]' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-start">
              <Calendar size={24} className={`mr-3 mt-1 ${index === 0 ? 'text-[#8C7356]' : 'text-gray-400'}`} />
              <div>
                <h3 className="font-semibold text-[#3E3128]">
                  {formatHolidayName(holiday.name)}
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
      
      <div className="mt-4 text-xs text-[#5A4635] text-right">
        <p>Es wird keine Haftung für die Richtigkeit übernommen, Daten bereitgestellt von <code>ferien-api.de</code></p>
      </div>
    </div>
  );
};

export default Holidays;
