package com.schooldashboard.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import org.springframework.web.client.RestTemplate;

import com.schooldashboard.config.CalendarProperties;
import com.schooldashboard.model.CalendarEvent;

@ExtendWith(MockitoExtension.class)
public class CalendarServiceTest {

    private static final String ICS_DATA = String.join("\r\n",
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//GGL//Calendar//EN",
            "BEGIN:VEVENT",
            "UID:future-event",
            "DTSTART;VALUE=DATE:20990101",
            "DTEND;VALUE=DATE:20990102",
            "SUMMARY:Neujahr",
            "DESCRIPTION:Ferien",
            "LOCATION:Berlin",
            "END:VEVENT",
            "BEGIN:VEVENT",
            "UID:past-event",
            "DTSTART;VALUE=DATE:20000101",
            "DTEND;VALUE=DATE:20000102",
            "SUMMARY:Alt",
            "END:VEVENT",
            "END:VCALENDAR") + "\r\n";

    @Mock
    private ApiResponseCacheService cacheService;

    private CalendarService service;
    private RestTemplate restTemplate;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        restTemplate = new RestTemplate();
        server = MockRestServiceServer.createServer(restTemplate);
        CalendarProperties properties = new CalendarProperties();
        properties.setIcsUrl("http://localhost/calendar.ics");
        service = new CalendarService(properties, restTemplate, cacheService);
    }

    @Test
    public void fetchesAndParsesCalendarEvents() {
        server.expect(requestTo("http://localhost/calendar.ics"))
                .andRespond(withSuccess(ICS_DATA, MediaType.TEXT_PLAIN));

        List<CalendarEvent> events = service.getUpcomingEvents(10);

        assertEquals(1, events.size());
        assertEquals("Neujahr", events.get(0).getSummary());
        verify(cacheService).store(eq(ApiResponseCacheKeys.CALENDAR_EVENTS), any());
        server.verify();
    }

    @Test
    public void trimsQuotedCalendarUrl() {
        CalendarProperties properties = new CalendarProperties();
        properties.setIcsUrl("\"http://localhost/calendar.ics\"");
        CalendarService quotedService = new CalendarService(properties, restTemplate, cacheService);
        server.expect(requestTo("http://localhost/calendar.ics"))
                .andRespond(withSuccess(ICS_DATA, MediaType.TEXT_PLAIN));

        List<CalendarEvent> events = quotedService.getUpcomingEvents(10);

        assertEquals(1, events.size());
        server.verify();
    }
}
