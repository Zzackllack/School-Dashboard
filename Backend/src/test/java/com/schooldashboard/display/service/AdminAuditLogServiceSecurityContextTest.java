package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.entity.AdminAuditLogEntity;
import com.schooldashboard.display.repository.AdminAuditLogRepository;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

public class AdminAuditLogServiceSecurityContextTest {

	private final AdminAuditLogRepository repository = Mockito.mock(AdminAuditLogRepository.class);
	private final AdminAuditLogService service = new AdminAuditLogService(repository, new ObjectMapper());

	@AfterEach
	public void cleanup() {
		SecurityContextHolder.clearContext();
	}

	@Test
	public void logCurrentAdminUsesAuthenticatedPrincipal() {
		SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin-user",
				"n/a", AuthorityUtils.createAuthorityList("ROLE_ADMIN")));
		when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		service.logCurrentAdmin("DISPLAY_UPDATED", "display", "display-1", Map.of("status", "ACTIVE"));

		ArgumentCaptor<AdminAuditLogEntity> captor = ArgumentCaptor.forClass(AdminAuditLogEntity.class);
		verify(repository).save(captor.capture());
		assertEquals("admin-user", captor.getValue().getAdminId());
		assertEquals("DISPLAY_UPDATED", captor.getValue().getAction());
	}
}
