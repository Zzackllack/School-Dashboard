import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import holidaysData from '../assets/holidays.json';

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
        const currentYear = new Date().getFullYear();
        const typedHolidaysData = holidaysData as HolidaysData;

        const currentYearStr = currentYear.toString();
        const nextYearStr = (currentYear + 1).toString();

        let allRelevantHolidays: Holiday[] = [];

        if (typedHolidaysData[currentYearStr]) {
          allRelevantHolidays = [...typedHolidaysData[currentYearStr]];
        }

        if (typedHolidaysData[nextYearStr]) {
          allRelevantHolidays = [...allRelevantHolidays, ...typedHolidaysData[nextYearStr]];
        }

        const currentDate = new Date();
        const upcomingHolidays = allRelevantHolidays.filter(holiday => {
          if (!holiday.end) return false;
          return new Date(holiday.end) >= currentDate;
        });

        upcomingHolidays.sort((a, b) => {
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        });

        setHolidays(upcomingHolidays.slice(0, 4));
        setError(null);
      } catch (err) {
        console.error('Failed to load holidays data:', err);
        setError('Fehler beim Laden der Feriendaten');
      } finally {
        setLoading(false);
      }
    };

    loadHolidays();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatHolidayName = (name: string) => {
    const formattedName = name.replace(/\s+berlin$/i, '').trim();
    return formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
  };

  const calculateDaysUntil = (startDateString: string) => {
    if (!startDateString) return '';

    const startDate = new Date(startDateString);
    const currentDate = new Date();

    currentDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const timeDiff = startDate.getTime() - currentDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (dayDiff < 0) return "Begonnen";
    if (dayDiff === 0) return "Heute";
    if (dayDiff === 1) return "Morgen";
    return `${dayDiff} Tage`;
  };

  const getEventHighlightClass = (type: string) => {
    switch(type.toLowerCase()) {
      case 'ferien':
        return 'bg-yellow-100/70 dark:bg-yellow-900/40 border-yellow-400 dark:border-yellow-600';
      case 'feiertag':
        return 'bg-blue-100/70 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600';
      case 'unterrichtsfrei':
        return 'bg-green-100/70 dark:bg-green-900/40 border-green-400 dark:border-green-600';
      default:
        return 'bg-gray-100/70 dark:bg-gray-700/40 border-gray-400 dark:border-gray-600';
    }
  };

  const getEventIconColor = (type: string) => {
    switch(type.toLowerCase()) {
      case 'ferien':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'feiertag':
        return 'text-blue-600 dark:text-blue-400';
      case 'unterrichtsfrei':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
        <div className="h-full flex flex-col">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Nächste Schulferien</h2>
          <div className="flex-1 flex justify-center items-center">
            <p className="text-3xl text-gray-700 dark:text-gray-300">Laden...</p>
          </div>
        </div>
    );
  }

  if (error || holidays.length === 0) {
    return (
        <div className="h-full flex flex-col">
          <h2 className="text-4xl font-medium text-gray-900 dark:text-white mb-8 text-center">Nächste Schulferien</h2>
          <div className="flex-1 flex justify-center items-center">
            <div className="bg-red-100/80 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 px-8 py-6 rounded-xl text-2xl text-center">
              {error || 'Keine Feriendaten verfügbar'}
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="h-full flex flex-col">
        <h2 className="text-4xl font-medium text-gray-900 dark:text-white mb-8 text-center">Nächste Schulferien</h2>

        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6">
          {holidays.map((holiday, index) => (
              <div
                  key={index}
                  className={`p-6 rounded-xl border-2 flex flex-col ${getEventHighlightClass(holiday.type)}`}
              >
                <div className="flex items-start mb-3">
                  <Calendar size={32} className={`mr-4 ${getEventIconColor(holiday.type)}`} />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1 line-clamp-2">
                    {formatHolidayName(holiday.name)}
                  </h3>
                </div>
                <p className="text-lg text-gray-800 dark:text-gray-200 mb-2">
                  {formatDate(holiday.start)} - {formatDate(holiday.end)}
                </p>
                <p className={`text-xl font-bold mt-auto ${getEventIconColor(holiday.type)}`}>
                  {calculateDaysUntil(holiday.start)}
                </p>
              </div>
          ))}
        </div>
      </div>
  );
};

export default Holidays;