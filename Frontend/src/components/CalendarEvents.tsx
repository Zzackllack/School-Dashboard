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

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      setLoading(true);
      try {
        // Replace with the ICS feed URL for your public calendar
        // Typically it's the public calendar URL with ?export added
        const calendarUrl = 'src/data/jh637-di34k-dsad4.ics';
        console.debug('Fetching calendar data from:', calendarUrl);
        
        const response = await fetch(calendarUrl);
        console.debug('Calendar API response:', response);
        if (!response.ok) {
          console.error('Calendar API error:', response.status, response.statusText);
          throw new Error(`Calendar API error: ${response.status}`);
        }
        
        const icsData = await response.text();
        console.debug('ICS data:', icsData);
        const jcalData = ICAL.parse(icsData);
        console.debug('jcalData:', jcalData);
        const comp = new ICAL.Component(jcalData);
        console.debug('ICAL Component:', comp);
        const vevents = comp.getAllSubcomponents('vevent');
        console.debug('Vevents:', vevents);
        
        const currentDate = new Date();
        console.debug('Current date:', currentDate);
        
        // Parse and sort calendar events
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
              isAllDay: event.startDate.isDate // Check if it's an all-day event
            };
          })
          // Filter only upcoming events (events ending in the future)
          .filter(event => event.endDate >= currentDate)
          // Sort by start date
          .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        setEvents(parsedEvents.slice(0, 5)); // Get only the next 5 events
        setError(null);
      } catch (err) {
        console.error('Failed to fetch calendar events:', err);
        setError('Termine konnten nicht geladen werden. Bitte versuche es später erneut, oder kontaktiere Cédric.');
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarEvents();
    
    // Refresh every 30 minutes
    const intervalId = setInterval(fetchCalendarEvents, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Format date to a readable format
  const formatEventDate = (startDate: Date, endDate: Date, isAllDay: boolean): string => {
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    
    // Add time for non-all-day events
    if (!isAllDay) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    const startDateStr = startDate.toLocaleDateString('de-DE', options);
    
    // If it's a multi-day event or spans different hours
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

  // Calculate how many days until the event
  const getDaysUntil = (startDate: Date, endDate: Date): string => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const eventStartDate = new Date(startDate);
    eventStartDate.setHours(0, 0, 0, 0);
    
    const eventEndDate = new Date(endDate);
    eventEndDate.setHours(0, 0, 0, 0);
    
    // Check if the event is currently ongoing
    if (now >= eventStartDate && now <= eventEndDate) {
      return "Läuft bereits";
    }
    
    const diffTime = eventStartDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    return `In ${diffDays} Tagen`;
  };

  // Check if an event is currently running
  const isEventRunning = (startDate: Date, endDate: Date): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const eventStartDate = new Date(startDate);
    eventStartDate.setHours(0, 0, 0, 0);
    
    const eventEndDate = new Date(endDate);
    eventEndDate.setHours(0, 0, 0, 0);
    
    return now >= eventStartDate && now <= eventEndDate;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 w-full">
      <h2 className="text-xl font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">
        Kommende Termine
        {loading && <span className="ml-2 text-sm font-normal text-gray-500">(Laden...)</span>}
      </h2>

      {error && (
        <div className="bg-[#F5E1DA] border border-[#A45D5D] text-[#A45D5D] px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div className="bg-[#F5EFD7] border border-[#DDB967] text-gray-800 px-4 py-3 rounded">
          Keine anstehenden Termine gefunden.
        </div>
      )}

      <div className="space-y-4">
        {events.map((event, index) => {
          const eventRunning = isEventRunning(event.startDate, event.endDate);
          return (
            <div 
              key={index} 
              className={`p-3 rounded-lg border transition-colors ${
                eventRunning 
                  ? "bg-amber-50 border-amber-300 border-l-4 shadow-md" 
                  : "bg-blue-50/50 border-blue-200 hover:bg-blue-100/50"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3 mt-1">
                  {event.isAllDay ? (
                    <Calendar size={24} className={`${eventRunning ? 'text-amber-600' : index === 0 ? 'text-[#8C7356]' : 'text-blue-500'}`} />
                  ) : (
                    <Clock size={24} className={`${eventRunning ? 'text-amber-600' : index === 0 ? 'text-[#8C7356]' : 'text-blue-500'}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${eventRunning ? 'text-amber-800' : 'text-[#3E3128]'}`}>
                    {event.summary}
                  </h3>
                  <p className={`${eventRunning ? 'text-amber-700' : 'text-[#5A4635]'}`}>
                    {formatEventDate(event.startDate, event.endDate, event.isAllDay)}
                  </p>
                  {event.location && (
                    <p className="text-sm text-gray-600">{event.location}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                  )}
                  <p className={`text-sm font-medium mt-1 ${
                    eventRunning 
                      ? 'text-amber-600 font-bold' 
                      : index === 0 ? 'text-[#8C7356]' : 'text-gray-500'
                  }`}>
                    {getDaysUntil(event.startDate, event.endDate)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Es wird keine Haftung für die Richtigkeit übernommen. Daten aus dem Schuljahreskalender der Nextcloud Instanz, letzte Aktualisierung am 2.4.2025</p>
      </div>
    </div>
  );
};

export default CalendarEvents;