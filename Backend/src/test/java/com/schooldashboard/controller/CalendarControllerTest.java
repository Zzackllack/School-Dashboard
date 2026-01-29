package com.schooldashboard.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.model.CalendarEvent;
import com.schooldashboard.service.ApiResponseCacheKeys;
import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.service.CalendarService;
import java.util.List;
import java.util.Optional;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CalendarController.class)
public class CalendarControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockBean
	private CalendarService calendarService;

	@MockBean
	private ApiResponseCacheService cacheService;

	@Test
	public void getEventsSuccess() throws Exception {
		CalendarEvent event = new CalendarEvent("Termin", "", "", 1L, 2L, false);
		when(calendarService.getUpcomingEvents(5)).thenReturn(List.of(event));

		mockMvc.perform(get("/api/calendar/events")).andExpect(status().isOk())
				.andExpect(content().string(Matchers.containsString("\"summary\":\"Termin\"")));
	}

	@Test
  public void getEventsFailure() throws Exception {
    when(calendarService.getUpcomingEvents(5)).thenThrow(new RuntimeException("fail"));
    when(cacheService.getRawJson(ApiResponseCacheKeys.CALENDAR_EVENTS))
        .thenReturn(Optional.empty());

    mockMvc
        .perform(get("/api/calendar/events"))
        .andExpect(status().isInternalServerError())
        .andExpect(content().string(Matchers.containsString("Error fetching calendar events")));
  }

	@Test
  public void getEventsNotConfiguredReturnsServiceUnavailable() throws Exception {
    when(calendarService.getUpcomingEvents(5))
        .thenThrow(new IllegalStateException("Calendar ICS URL is not configured"));
    when(cacheService.getRawJson(ApiResponseCacheKeys.CALENDAR_EVENTS))
        .thenReturn(Optional.empty());

    mockMvc
        .perform(get("/api/calendar/events"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(content().string(Matchers.containsString("Error fetching calendar events")));
  }

	@Test
  public void getEventsFailureFallsBackToCache() throws Exception {
    when(calendarService.getUpcomingEvents(5)).thenThrow(new RuntimeException("fail"));
    when(cacheService.getRawJson(ApiResponseCacheKeys.CALENDAR_EVENTS))
        .thenReturn(Optional.of("[{\"summary\":\"Cached\"}]"));

    mockMvc
        .perform(get("/api/calendar/events"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"))
        .andExpect(content().string("[{\"summary\":\"Cached\"}]"));
  }

	@Test
  public void getEventsCacheRespectsLimit() throws Exception {
    when(calendarService.getUpcomingEvents(1)).thenThrow(new RuntimeException("fail"));
    when(cacheService.getRawJson(ApiResponseCacheKeys.CALENDAR_EVENTS))
        .thenReturn(Optional.of("[{\"summary\":\"A\"},{\"summary\":\"B\"}]"));

    mockMvc
        .perform(get("/api/calendar/events").param("limit", "1"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"))
        .andExpect(content().string("[{\"summary\":\"A\"}]"));
  }

	@Test
	public void getEventsRejectsInvalidLimit() throws Exception {
		mockMvc.perform(get("/api/calendar/events").param("limit", "0")).andExpect(status().isBadRequest())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("Limit must be between 1 and 100")));
	}
}
