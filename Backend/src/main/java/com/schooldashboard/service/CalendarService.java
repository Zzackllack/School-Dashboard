package com.schooldashboard.service;

import com.schooldashboard.config.CalendarProperties;
import com.schooldashboard.model.CalendarEvent;
import java.io.IOException;
import java.io.StringReader;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.data.ParserException;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Date;
import net.fortuna.ical4j.model.DateTime;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.DtEnd;
import net.fortuna.ical4j.model.property.DtStart;
import net.fortuna.ical4j.model.property.Summary;
import net.fortuna.ical4j.model.property.Description;
import net.fortuna.ical4j.model.property.Location;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class CalendarService {

    private static final Logger logger = LoggerFactory.getLogger(CalendarService.class);

    private final CalendarProperties properties;
    private final RestTemplate restTemplate;
    private final ApiResponseCacheService cacheService;

    public CalendarService(CalendarProperties properties, RestTemplate restTemplate, ApiResponseCacheService cacheService) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.cacheService = cacheService;
    }

    public List<CalendarEvent> getUpcomingEvents(int limit) {
        String calendarUrl = sanitizeUrl(properties.getIcsUrl());
        if (calendarUrl == null || calendarUrl.isBlank()) {
            logger.warn("Calendar ICS URL not configured (calendar.ics-url)");
            throw new IllegalStateException("Calendar ICS URL is not configured");
        }

        logger.info("Fetching calendar ICS from {}", calendarUrl);
        ResponseEntity<String> response = restTemplate.getForEntity(calendarUrl, String.class);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Calendar ICS response returned status " + response.getStatusCode().value());
        }
        if (response.getBody() == null || response.getBody().isBlank()) {
            throw new IllegalStateException("Calendar ICS response is empty");
        }

        List<CalendarEvent> events = parseEvents(response.getBody(), Instant.now());
        cacheService.store(ApiResponseCacheKeys.CALENDAR_EVENTS, events);
        if (limit <= 0 || events.size() <= limit) {
            return events;
        }
        return events.subList(0, limit);
    }

    private List<CalendarEvent> parseEvents(String icsData, Instant now) {
        List<CalendarEvent> parsed = new ArrayList<>();
        try {
            CalendarBuilder builder = new CalendarBuilder();
            Calendar calendar = builder.build(new StringReader(icsData));
            List<?> components = calendar.getComponents(net.fortuna.ical4j.model.Component.VEVENT);
            for (Object component : components) {
                if (!(component instanceof VEvent)) {
                    continue;
                }
                VEvent event = (VEvent) component;
                DtStart startProperty = event.getStartDate();
                if (startProperty == null) {
                    continue;
                }
                Date startDate = startProperty.getDate();
                Date endDate = getEndDate(event, startDate);
                if (startDate == null || endDate == null) {
                    continue;
                }
                boolean allDay = !(startDate instanceof DateTime);
                Instant startInstant = Instant.ofEpochMilli(startDate.getTime());
                Instant endInstant = Instant.ofEpochMilli(endDate.getTime());
                if (endInstant.isBefore(now)) {
                    continue;
                }

                parsed.add(new CalendarEvent(
                        getValue(event.getSummary()),
                        getValue(event.getDescription()),
                        getValue(event.getLocation()),
                        startInstant.toEpochMilli(),
                        endInstant.toEpochMilli(),
                        allDay));
            }
        } catch (IOException | ParserException ex) {
            throw new IllegalStateException("Failed to parse calendar data", ex);
        }

        parsed.sort(Comparator.comparingLong(CalendarEvent::getStartDate));
        return parsed;
    }

    private Date getEndDate(VEvent event, Date startDate) {
        DtEnd endProperty = event.getEndDate();
        if (endProperty != null && endProperty.getDate() != null) {
            return endProperty.getDate();
        }
        return startDate;
    }

    private String getValue(Summary summary) {
        return summary == null ? "" : summary.getValue();
    }

    private String getValue(Description description) {
        return description == null ? "" : description.getValue();
    }

    private String getValue(Location location) {
        return location == null ? "" : location.getValue();
    }

    private String sanitizeUrl(String url) {
        if (url == null) {
            return null;
        }
        String trimmed = url.trim();
        if (trimmed.length() >= 2 && trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
            return trimmed.substring(1, trimmed.length() - 1).trim();
        }
        return trimmed;
    }
}
