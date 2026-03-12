package com.schooldashboard.survey.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.survey.dto.AdminSurveyListItemResponse;
import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.service.SurveyAdminService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminSurveyController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AdminSurveyControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private SurveyAdminService surveyAdminService;

	@MockitoBean
	@SuppressWarnings("unused")
	private CacheManager cacheManager;

	@Test
	public void listInboxReturnsPayload() throws Exception {
		when(surveyAdminService.getInbox(eq(SurveyCategory.PROBLEM), eq("display-1"), eq("qr"), eq(10))).thenReturn(
				List.of(new AdminSurveyListItemResponse("survey-1", "display-1", "Haupteingang", "Lobby",
						SurveyCategory.PROBLEM, "QR Code ist zu klein.", "Mila", "10a", true,
						Instant.parse("2026-03-12T15:18:50Z"))));

		mockMvc.perform(get("/api/admin/surveys").queryParam("category", "PROBLEM").queryParam("displayId", "display-1")
				.queryParam("query", "qr").queryParam("limit", "10")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value("survey-1"))
				.andExpect(jsonPath("$[0].displayName").value("Haupteingang"))
				.andExpect(jsonPath("$[0].submitterName").value("Mila"));
	}
}
