package com.schooldashboard.display.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.display.config.DisplayRateLimitProperties;
import com.schooldashboard.display.dto.CreateEnrollmentResponse;
import com.schooldashboard.display.dto.DisplaySessionValidationResponse;
import com.schooldashboard.display.service.DisplayEnrollmentService;
import com.schooldashboard.display.service.RequestRateLimiter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DisplayPublicController.class)
public class DisplayPublicControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private DisplayEnrollmentService enrollmentService;

	@MockitoBean
	private RequestRateLimiter rateLimiter;

	@MockitoBean
	private DisplayRateLimitProperties rateLimitProperties;

	@MockitoBean
	@SuppressWarnings("unused")
	private CacheManager cacheManager;

	@Test
	public void createEnrollmentReturnsCreated() throws Exception {
		when(rateLimitProperties.getEnrollmentsPerMinute()).thenReturn(20);
		when(rateLimiter.tryAcquire(anyString(), anyString(), eq(20), any())).thenReturn(true);
		when(enrollmentService.createEnrollmentRequest(any()))
				.thenReturn(new CreateEnrollmentResponse("req-1", "PENDING", 5));

		mockMvc.perform(post("/api/displays/enrollments").contentType("application/json")
				.content("{\"enrollmentCode\":\"ABCD1234\",\"proposedDisplayName\":\"Lobby\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.requestId").value("req-1"))
				.andExpect(jsonPath("$.status").value("PENDING"));
	}

	@Test
	public void validateSessionReturnsValidityPayload() throws Exception {
		when(rateLimitProperties.getSessionValidationsPerMinute()).thenReturn(120);
		when(rateLimiter.tryAcquire(anyString(), anyString(), eq(120), any())).thenReturn(true);
		when(enrollmentService.validateSession("token-123")).thenReturn(
				new DisplaySessionValidationResponse(true, "display-1", "lobby", "default", "/display/display-1"));

		mockMvc.perform(get("/api/displays/session").header("Authorization", "Bearer token-123"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.valid").value(true))
				.andExpect(jsonPath("$.displayId").value("display-1"));
	}

	@Test
	public void createEnrollmentReturns429WhenRateLimitExceeded() throws Exception {
		when(rateLimitProperties.getEnrollmentsPerMinute()).thenReturn(1);
		when(rateLimiter.tryAcquire(anyString(), anyString(), eq(1), any())).thenReturn(false);

		mockMvc.perform(post("/api/displays/enrollments").contentType("application/json")
				.content("{\"enrollmentCode\":\"ABCD1234\",\"proposedDisplayName\":\"Lobby\"}"))
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.code").value("RATE_LIMIT_EXCEEDED"));
	}
}
