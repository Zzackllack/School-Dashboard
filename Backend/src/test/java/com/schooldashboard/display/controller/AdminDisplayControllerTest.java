package com.schooldashboard.display.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.schooldashboard.display.dto.CreateEnrollmentCodeResponse;
import com.schooldashboard.display.service.AdminAuthService;
import com.schooldashboard.display.service.DisplayEnrollmentService;
import com.schooldashboard.display.web.DisplayDomainException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminDisplayController.class)
public class AdminDisplayControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private DisplayEnrollmentService enrollmentService;

	@MockitoBean
	private AdminAuthService adminAuthService;

	@MockitoBean
	@SuppressWarnings("unused")
	private CacheManager cacheManager;

	@Test
	public void createEnrollmentCodeRequiresAdminToken() throws Exception {
		when(adminAuthService.requireAdmin(eq("valid-token"), eq("1234"), eq("school-admin"))).thenReturn("school-admin");
		when(enrollmentService.createEnrollmentCode(eq("school-admin"), any()))
				.thenReturn(new CreateEnrollmentCodeResponse("code-1", "ABCD1234", Instant.now(), 3));

		mockMvc.perform(post("/api/admin/displays/enrollment-codes").header("X-Admin-Token", "valid-token")
				.header("X-Admin-Password", "1234")
				.header("X-Admin-Id", "school-admin").contentType("application/json")
				.content("{\"ttlSeconds\":300,\"maxUses\":3}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.code").value("ABCD1234"));
	}

	@Test
	public void createEnrollmentCodeReturnsUnauthorizedForInvalidToken() throws Exception {
		when(adminAuthService.requireAdmin(eq("bad-token"), eq("1234"), isNull()))
				.thenThrow(new DisplayDomainException("ADMIN_UNAUTHORIZED", HttpStatus.UNAUTHORIZED,
						"Admin authentication failed"));

		mockMvc.perform(post("/api/admin/displays/enrollment-codes").header("X-Admin-Token", "bad-token")
				.header("X-Admin-Password", "1234")
				.contentType("application/json").content("{}"))
				.andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("ADMIN_UNAUTHORIZED"));
	}

	@Test
	public void listDisplaysUsesAdminAuth() throws Exception {
		when(adminAuthService.requireAdmin(eq("valid-token"), eq("1234"), isNull())).thenReturn("admin");
		when(enrollmentService.listDisplays()).thenReturn(List.of());

		mockMvc.perform(get("/api/admin/displays").header("X-Admin-Token", "valid-token")
				.header("X-Admin-Password", "1234"))
				.andExpect(status().isOk());
	}
}
