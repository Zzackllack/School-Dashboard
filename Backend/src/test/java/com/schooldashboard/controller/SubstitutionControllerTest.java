package com.schooldashboard.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.service.SubstitutionPlanService;
import java.util.Collections;
import java.util.List;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SubstitutionController.class)
public class SubstitutionControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockBean
	private SubstitutionPlanService service;

	@MockBean
	private ApiResponseCacheService cacheService;

	@Test
  public void getPlansSuccess() throws Exception {
    when(service.getSubstitutionPlans())
        .thenReturn(Collections.singletonList(new com.schooldashboard.model.SubstitutionPlan()));
    mockMvc.perform(get("/api/substitution/plans")).andExpect(status().isOk());
  }

	@Test
  public void getPlansEmptyFallsBackToDb() throws Exception {
    when(service.getSubstitutionPlans()).thenReturn(Collections.emptyList());
    when(cacheService.getRawJson("api/substitution/plans"))
        .thenReturn(java.util.Optional.of("[{\"date\":\"d\"}]"));
    mockMvc
        .perform(get("/api/substitution/plans"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"))
        .andExpect(content().string("[{\"date\":\"d\"}]"));
  }

	@Test
  public void getPlansFailure() throws Exception {
    when(service.getSubstitutionPlans()).thenThrow(new RuntimeException("bad"));
    when(cacheService.getRawJson("api/substitution/plans")).thenReturn(java.util.Optional.empty());
    mockMvc
        .perform(get("/api/substitution/plans"))
        .andExpect(status().isBadRequest())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("bad")));
  }

	@Test
	public void getPlansIncludesDailyNews() throws Exception {
		com.schooldashboard.model.SubstitutionPlan plan = new com.schooldashboard.model.SubstitutionPlan("2024-01-01",
				"t");
		plan.getNews().addNewsItem("Announcement 1");
		plan.getNews().addNewsItem("Announcement 2");
		when(service.getSubstitutionPlans()).thenReturn(List.of(plan));

		mockMvc.perform(get("/api/substitution/plans")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].news.date").value("2024-01-01"))
				.andExpect(jsonPath("$[0].news.newsItems", Matchers.hasSize(2)))
				.andExpect(jsonPath("$[0].news.newsItems[0]").value("Announcement 1"))
				.andExpect(jsonPath("$[0].news.newsItems[1]").value("Announcement 2"));
	}
}
