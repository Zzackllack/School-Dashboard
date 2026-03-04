package com.schooldashboard.security.integration;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.security.auth.dto.AdminLoginRequest;
import com.schooldashboard.security.entity.AppRoleEntity;
import com.schooldashboard.security.entity.AppUserEntity;
import com.schooldashboard.security.repository.AppRoleRepository;
import com.schooldashboard.security.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false", "dsb.username=test", "dsb.password=test",
		"calendar.ics-url=", "security.admin.bootstrap.enabled=true", "security.admin.bootstrap.username=test-admin",
		"security.admin.bootstrap.password=test-admin-password"})
@AutoConfigureMockMvc
public class AdminSecurityIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private AppUserRepository appUserRepository;

	@Autowired
	private AppRoleRepository appRoleRepository;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@BeforeEach
	public void ensureOperatorUserExists() {
		AppRoleEntity operatorRole = appRoleRepository.findByName("ROLE_OPERATOR")
				.orElseGet(() -> appRoleRepository.save(new AppRoleEntity("ROLE_OPERATOR")));

		if (appUserRepository.findByUsername("operator").isEmpty()) {
			AppUserEntity operatorUser = new AppUserEntity("operator", passwordEncoder.encode("operator-password"));
			operatorUser.addRole(operatorRole);
			appUserRepository.save(operatorUser);
		}
	}

	@Test
	public void unauthenticatedAdminRequestReturns401() throws Exception {
		mockMvc.perform(get("/api/admin/displays")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	public void nonAdminUserGets403OnAdminRoute() throws Exception {
		MockHttpSession operatorSession = login("operator", "operator-password");

		mockMvc.perform(get("/api/admin/displays").session(operatorSession)).andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

	@Test
	public void csrfIsRequiredForMutatingAdminRequests() throws Exception {
		MockHttpSession adminSession = login("test-admin", "test-admin-password");

		mockMvc.perform(post("/api/admin/displays/enrollment-codes").session(adminSession)
				.contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isForbidden())
				.andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

	@Test
	public void adminMeAndLogoutLifecycleWorks() throws Exception {
		MockHttpSession adminSession = login("test-admin", "test-admin-password");

		mockMvc.perform(get("/api/admin/auth/me").session(adminSession)).andExpect(status().isOk())
				.andExpect(jsonPath("$.authenticated").value(true))
				.andExpect(jsonPath("$.username").value("test-admin"));

		mockMvc.perform(post("/api/admin/auth/logout").session(adminSession).with(csrf())).andExpect(status().isOk())
				.andExpect(jsonPath("$.authenticated").value(false));

		mockMvc.perform(get("/api/admin/auth/me").session(adminSession)).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	public void publicDisplayRouteRemainsAccessibleWithoutAdminSession() throws Exception {
		mockMvc.perform(get("/api/displays/session")).andExpect(status().isOk())
				.andExpect(jsonPath("$.valid").value(false));
	}

	private MockHttpSession login(String username, String password) throws Exception {
		MvcResult result = mockMvc
				.perform(post("/api/admin/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new AdminLoginRequest(username, password))))
				.andExpect(status().isOk()).andReturn();
		return (MockHttpSession) result.getRequest().getSession(false);
	}
}
