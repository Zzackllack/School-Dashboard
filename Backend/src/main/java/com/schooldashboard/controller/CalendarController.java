package com.schooldashboard.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
    private final ObjectMapper objectMapper;

    public CalendarController(CalendarService calendarService, ApiResponseCacheService cacheService, ObjectMapper objectMapper) {
        this.calendarService = calendarService;
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
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
                String limitedJson = limitCachedEvents(cached.get(), limit);
                return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(limitedJson);
            }
            if (e instanceof IllegalStateException && e.getMessage() != null
                    && e.getMessage().contains("not configured")) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("Error fetching calendar events");
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching calendar events");
        }
    }

    private String limitCachedEvents(String cachedJson, int limit) {
        if (cachedJson == null || cachedJson.isBlank()) {
            return "[]";
        }
        try {
            JsonNode node = objectMapper.readTree(cachedJson);
            if (!node.isArray()) {
                return cachedJson;
            }
            ArrayNode array = (ArrayNode) node;
            if (array.size() <= limit) {
                return cachedJson;
            }
            ArrayNode truncated = objectMapper.createArrayNode();
            for (int i = 0; i < limit; i++) {
                truncated.add(array.get(i));
            }
            return objectMapper.writeValueAsString(truncated);
        } catch (Exception ex) {
            logger.warn("Failed to parse cached calendar events", ex);
            return cachedJson;
        }
    }
}
