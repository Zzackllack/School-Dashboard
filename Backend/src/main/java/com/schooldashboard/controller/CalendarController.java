package com.schooldashboard.controller;

import com.schooldashboard.service.ApiResponseCacheKeys;
import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.service.CalendarService;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private static final Logger logger = LoggerFactory.getLogger(CalendarController.class);

    private final CalendarService calendarService;
    private final ApiResponseCacheService cacheService;

    public CalendarController(CalendarService calendarService, ApiResponseCacheService cacheService) {
        this.calendarService = calendarService;
        this.cacheService = cacheService;
    }

    @GetMapping("/events")
    public ResponseEntity<?> getEvents(@RequestParam(defaultValue = "5") int limit) {
        if (limit < 1 || limit > 100) {
            return ResponseEntity.badRequest().body("Limit must be between 1 and 100");
        }
        try {
            return ResponseEntity.ok(calendarService.getUpcomingEvents(limit));
        } catch (Exception e) {
            logger.warn("Failed to fetch calendar events", e);
            Optional<String> cached = cacheService.getRawJson(ApiResponseCacheKeys.CALENDAR_EVENTS);
            if (cached.isPresent()) {
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(cached.get());
            }
            if (e instanceof IllegalStateException && e.getMessage() != null
                    && e.getMessage().contains("not configured")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Error fetching calendar events: " + e.getMessage());
            }
            return ResponseEntity.badRequest().body("Error fetching calendar events: " + e.getMessage());
        }
    }
}
