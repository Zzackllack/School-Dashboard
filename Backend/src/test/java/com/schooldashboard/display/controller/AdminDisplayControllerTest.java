package com.schooldashboard.display.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.display.dto.CreateEnrollmentCodeResponse;
import com.schooldashboard.display.dto.AdminAuditLogResponse;
import com.schooldashboard.display.service.AdminAuditLogService;
import com.schooldashboard.display.service.DisplayEnrollmentService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminDisplayController.class)
public class AdminDisplayControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private DisplayEnrollmentService enrollmentService;

	@MockitoBean
	private AdminAuditLogService adminAuditLogService;

	@MockitoBean
	@SuppressWarnings("unused")
	private CacheManager cacheManager;

	@Test
	@WithMockUser(username = "school-admin", roles = "ADMIN")
	public void createEnrollmentCodeUsesAuthenticatedPrincipal() throws Exception {
		when(enrollmentService.createEnrollmentCode(eq("school-admin"), any()))
				.thenReturn(new CreateEnrollmentCodeResponse("code-1", "ABCD1234", Instant.now(), 3));

		mockMvc.perform(post("/api/admin/displays/enrollment-codes").with(csrf())
				.contentType("application/json").content("{\"ttlSeconds\":300,\"maxUses\":3}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.code").value("ABCD1234"));
	}

	@Test
	@WithMockUser(username = "school-admin", roles = "ADMIN")
	public void listDisplaysReturnsOk() throws Exception {
		when(enrollmentService.listDisplays()).thenReturn(List.of());

		mockMvc.perform(get("/api/admin/displays")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(username = "school-admin", roles = "ADMIN")
	public void listAuditLogsReturnsRecentEntries() throws Exception {
		Instant createdAt = Instant.parse("2026-03-07T12:00:00Z");
		when(adminAuditLogService.listRecent(10)).thenReturn(List.of(new AdminAuditLogResponse("audit-1",
				"school-admin", "DISPLAY_UPDATED", "display", "display-1", null, createdAt)));

		mockMvc.perform(get("/api/admin/displays/audit-logs").param("limit", "10")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value("audit-1"))
				.andExpect(jsonPath("$[0].action").value("DISPLAY_UPDATED"))
				.andExpect(jsonPath("$[0].createdAt").value("2026-03-07T12:00:00Z"));
	}
}
