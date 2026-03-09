package com.schooldashboard.survey.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.display.service.RequestRateLimiter;
import com.schooldashboard.survey.config.SurveyRateLimitProperties;
import com.schooldashboard.survey.dto.CreateSurveySubmissionResponse;
import com.schooldashboard.survey.dto.SurveyDisplayContextResponse;
import com.schooldashboard.survey.service.SurveyPublicService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SurveyPublicController.class)
@AutoConfigureMockMvc(addFilters = false)
public class SurveyPublicControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private SurveyPublicService surveyPublicService;

	@MockitoBean
	private RequestRateLimiter requestRateLimiter;

	@MockitoBean
	private SurveyRateLimitProperties surveyRateLimitProperties;

	@MockitoBean
	@SuppressWarnings("unused")
	private CacheManager cacheManager;

	@Test
	public void getDisplayContextReturnsPayload() throws Exception {
		when(surveyPublicService.getDisplayContext("123e4567-e89b-12d3-a456-426614174000"))
				.thenReturn(new SurveyDisplayContextResponse("123e4567-e89b-12d3-a456-426614174000", "Haupteingang",
						"Lobby", "default", true));

		mockMvc.perform(get("/api/surveys/displays/123e4567-e89b-12d3-a456-426614174000")).andExpect(status().isOk())
				.andExpect(jsonPath("$.displayName").value("Haupteingang"))
				.andExpect(jsonPath("$.acceptingFeedback").value(true));
	}

	@Test
	public void createSubmissionReturnsCreated() throws Exception {
		when(surveyRateLimitProperties.getSubmissionsPerMinute()).thenReturn(5);
		when(requestRateLimiter.tryAcquire(anyString(), anyString(), eq(5), any())).thenReturn(true);
		when(surveyPublicService.createSubmission(any(), anyString()))
				.thenReturn(new CreateSurveySubmissionResponse("submission-1", java.time.Instant.parse("2026-03-09T10:15:30Z"),
						"RECORDED"));

		mockMvc.perform(post("/api/surveys/submissions").contentType("application/json")
				.content("""
						{
						  "displayId": "123e4567-e89b-12d3-a456-426614174000",
						  "category": "PROBLEM",
						  "message": "Der QR-Code sollte etwas groesser dargestellt werden.",
						  "name": "Mila"
						}
						"""))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.submissionId").value("submission-1"))
				.andExpect(jsonPath("$.status").value("RECORDED"));
	}

	@Test
	public void createSubmissionRejectsEmptyMessage() throws Exception {
		when(surveyRateLimitProperties.getSubmissionsPerMinute()).thenReturn(5);
		when(requestRateLimiter.tryAcquire(anyString(), anyString(), eq(5), any())).thenReturn(true);

		mockMvc.perform(post("/api/surveys/submissions").contentType("application/json")
				.content("""
						{
						  "displayId": "123e4567-e89b-12d3-a456-426614174000",
						  "category": "PROBLEM",
						  "message": "   "
						}
						"""))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SURVEY_VALIDATION_ERROR"))
				.andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Nachricht ist erforderlich")));
	}

	@Test
	public void createSubmissionReturns429WhenRateLimitExceeded() throws Exception {
		when(surveyRateLimitProperties.getSubmissionsPerMinute()).thenReturn(1);
		when(requestRateLimiter.tryAcquire(anyString(), anyString(), eq(1), any())).thenReturn(false);

		mockMvc.perform(post("/api/surveys/submissions").contentType("application/json")
				.content("""
						{
						  "displayId": "123e4567-e89b-12d3-a456-426614174000",
						  "category": "PROBLEM",
						  "message": "Der QR-Code ist zu klein fuer einige Geraete."
						}
						"""))
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.code").value("SURVEY_RATE_LIMIT_EXCEEDED"));
	}
}
