package com.schooldashboard.controller;

import java.util.Collections;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.service.DSBService;
import com.schooldashboard.util.DSBMobile;

@WebMvcTest(DSBController.class)
public class DSBControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockBean
	private DSBService dsbService;

	@MockBean
	private ApiResponseCacheService cacheService;

	@Test
	public void getTimeTablesSuccess() throws Exception {
		DSBMobile.TimeTable table = new DSBMobile("", "").new TimeTable(
				UUID.fromString("a05eab4c-af64-49f8-b8e6-e608269ebc05"), "Schüler heute", "16.12.2025 11:57",
				"subst_001.htm", "https://example.test/subst_001.htm");
		when(dsbService.getTimeTables()).thenReturn(Collections.singletonList(table));
		mockMvc.perform(get("/api/dsb/timetables")).andExpect(status().isOk()).andExpect(content()
				.string(org.hamcrest.Matchers.containsString("\"detail\":\"https://example.test/subst_001.htm\"")));
	}

	@Test
  public void getTimeTablesEmptyListReturnsOk() throws Exception {
    when(dsbService.getTimeTables()).thenReturn(Collections.emptyList());
    mockMvc
        .perform(get("/api/dsb/timetables"))
        .andExpect(status().isOk())
        .andExpect(content().string("[]"));
  }

	@Test
  public void getTimeTablesFailure() throws Exception {
    when(dsbService.getTimeTables()).thenThrow(new RuntimeException("fail"));
    when(cacheService.getRawJson("api/dsb/timetables")).thenReturn(java.util.Optional.empty());
    mockMvc
        .perform(get("/api/dsb/timetables"))
        .andExpect(status().isBadRequest())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("fail")));
  }

	@Test
  public void getTimeTablesFailureFallsBackToDb() throws Exception {
    when(dsbService.getTimeTables()).thenThrow(new RuntimeException("fail"));
    when(cacheService.getRawJson("api/dsb/timetables"))
        .thenReturn(java.util.Optional.of("[{\"k\":\"v\"}]"));
    mockMvc
        .perform(get("/api/dsb/timetables"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"))
        .andExpect(content().string("[{\"k\":\"v\"}]"));
  }
  
  @Test
  public void getNewsSuccess() throws Exception {
    when(dsbService.getNews()).thenReturn(Collections.singletonList("n"));
    mockMvc
        .perform(get("/api/dsb/news"))
        .andExpect(status().isOk())
        .andExpect(content().string("[\"n\"]"));
  }

	@Test
  public void getNewsFailure() throws Exception {
    when(dsbService.getNews()).thenThrow(new RuntimeException("no"));
    mockMvc
        .perform(get("/api/dsb/news"))
        .andExpect(status().isBadRequest())
        .andExpect(content().string(org.hamcrest.Matchers.containsString("no")));
  }
}
