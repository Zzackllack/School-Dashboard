import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import ICAL from 'ical.js';

interface CalendarEvent {
  summary: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  isAllDay: boolean;
}

const CalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setLoading(true);
      try {
        const calendarUrl = '/data/jh637-di34k-dsad4.ics';

        const response = await fetch(calendarUrl);
        if (!response.ok) {
          throw new Error(`Calendar API error: ${response.status}`);
        }

        const icsData = await response.text();
        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const currentDate = new Date();

        const parsedEvents: CalendarEvent[] = vevents
            .map(vevent => {
              const event = new ICAL.Event(vevent);
              const startDate = event.startDate.toJSDate();
              const endDate = event.endDate.toJSDate();

              return {
                summary: event.summary,
                description: event.description || '',
                location: event.location || '',
                startDate,
                endDate,
                isAllDay: event.startDate.isDate
              };
            })
            .filter(event => event.endDate >= currentDate)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        setEvents(parsedEvents.slice(0, 8));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
        setError('Termine konnten nicht geladen werden');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();

    const intervalId = setInterval(fetchCalendarEvents, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (events.length <= 4) return;

    const pageInterval = setInterval(() => {
      setCurrentPage(prev => (prev === 0 ? 1 : 0));
    }, 16000);

    return () => clearInterval(pageInterval);
  }, [events.length]);

  const formatEventDate = (startDate: Date, endDate: Date, isAllDay: boolean): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit'
    };

    if (!isAllDay) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    const startDateStr = startDate.toLocaleDateString('de-DE', options);

    if (
        startDate.getDate() !== endDate.getDate() ||
        startDate.getMonth() !== endDate.getMonth() ||
        startDate.getFullYear() !== endDate.getFullYear() ||
        (!isAllDay && (
            startDate.getHours() !== endDate.getHours() ||
            startDate.getMinutes() !== endDate.getMinutes()
        ))
    ) {
      const endDateStr = endDate.toLocaleDateString('de-DE', options);
      return `${startDateStr} - ${endDateStr}`;
    }

    return startDateStr;
  };

  const getDaysUntil = (startDate: Date, endDate: Date): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const eventStartDate = new Date(startDate);
    eventStartDate.setHours(0, 0, 0, 0);

    const eventEndDate = new Date(endDate);
    eventEndDate.setHours(0, 0, 0, 0);

    if (now >= eventStartDate && now <= eventEndDate) {
      return "Läuft";
    }

    const diffTime = eventStartDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    return `${diffDays}T`;
  };

  const isEventRunning = (startDate: Date, endDate: Date): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const eventStartDate = new Date(startDate);
    eventStartDate.setHours(0, 0, 0, 0);

    const eventEndDate = new Date(endDate);
    eventEndDate.setHours(0, 0, 0, 0);

    return now >= eventStartDate && now <= eventEndDate;
  };

  if (loading) {
    return (
        <div className="h-full flex flex-col">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Kommende Termine</h2>
          <div className="flex-1 flex justify-center items-center">
            <p className="text-3xl text-gray-700 dark:text-gray-300">Laden...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="h-full flex flex-col">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Kommende Termine</h2>
          <div className="flex-1 flex justify-center items-center">
            <div className="bg-red-100/80 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200 px-8 py-6 rounded-xl text-2xl text-center">
              {error}
            </div>
          </div>
        </div>
    );
  }

  if (events.length === 0) {
    return (
        <div className="h-full flex flex-col">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">Kommende Termine</h2>
          <div className="flex-1 flex justify-center items-center">
            <div className="bg-yellow-100/80 dark:bg-yellow-900/40 border-2 border-yellow-400 dark:border-yellow-600 text-yellow-900 dark:text-yellow-200 px-8 py-6 rounded-xl text-2xl text-center">
              Keine anstehenden Termine
            </div>
          </div>
        </div>
    );
  }

  const displayEvents = events.length <= 4
      ? events
      : currentPage === 0
          ? events.slice(0, 4)
          : events.slice(4, 8);

  return (
      <div className="h-full flex flex-col">
        <h2 className="text-4xl font-medium text-gray-900 dark:text-white mb-8 text-center">Kommende Termine</h2>

        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-6">
          {displayEvents.map((event, index) => {
            const eventRunning = isEventRunning(event.startDate, event.endDate);
            return (
                <div
                    key={index}
                    className={`p-6 rounded-xl border-2 flex flex-col ${
                        eventRunning
                            ? "bg-amber-100/80 dark:bg-amber-900/40 border-amber-400 dark:border-amber-600"
                            : "bg-blue-50/60 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700"
                    }`}
                >
                  <div className="flex items-start mb-3">
                    <div className="flex-shrink-0 mr-4">
                      {event.isAllDay ? (
                          <Calendar size={32} className={`${eventRunning ? 'text-amber-700 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      ) : (
                          <Clock size={32} className={`${eventRunning ? 'text-amber-700 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xl font-bold mb-2 line-clamp-2 ${eventRunning ? 'text-amber-900 dark:text-amber-100' : 'text-gray-900 dark:text-white'}`}>
                        {event.summary}
                      </h3>
                    </div>
                  </div>
                  <p className={`text-lg mb-2 ${eventRunning ? 'text-amber-800 dark:text-amber-200' : 'text-gray-800 dark:text-gray-200'}`}>
                    {formatEventDate(event.startDate, event.endDate, event.isAllDay)}
                  </p>
                  <p className={`text-xl font-bold mt-auto ${
                      eventRunning
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {getDaysUntil(event.startDate, event.endDate)}
                  </p>
                </div>
            );
          })}
        </div>
      </div>
  );
};

export default CalendarEvents;