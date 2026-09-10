package com.schooldashboard.warning.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.warning.model.WarningSnapshot;
import com.schooldashboard.warning.service.WarningService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WarningController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(WarningControllerTest.TestConfiguration.class)
class WarningControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private WarningService warningService;

	@MockitoBean
	@SuppressWarnings("unused")
	private CacheManager cacheManager;

	@Test
	void returnsCurrentWarningSnapshotWithoutBrowserCaching() throws Exception {
		when(warningService.getCurrentSnapshot()).thenReturn(new WarningSnapshot(null, null, true, List.of()));

		mockMvc.perform(get("/api/warnings/current")).andExpect(status().isOk())
				.andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))
				.andExpect(content().contentTypeCompatibleWith("application/json"))
				.andExpect(content().string(org.hamcrest.Matchers.containsString("\"sourceAvailable\":true")));
	}

	@org.springframework.boot.test.context.TestConfiguration
	static class TestConfiguration {
	}
}
