package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.entity.AdminAuditLogEntity;
import com.schooldashboard.display.repository.AdminAuditLogRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.data.domain.Pageable;
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

	@Test
	public void listRecentCapsLimitAndParsesMetadata() {
		AdminAuditLogEntity entity = new AdminAuditLogEntity("admin-user", "DISPLAY_UPDATED", "display", "display-1",
				"{\"status\":\"ACTIVE\"}");
		when(repository.findAllByOrderByCreatedAtDesc(argThat((Pageable pageable) -> pageable.getPageSize() == 200)))
				.thenReturn(List.of(entity));

		var response = service.listRecent(1000);

		assertEquals(1, response.size());
		assertEquals("admin-user", response.getFirst().adminId());
		assertNotNull(response.getFirst().metadata());
		assertEquals("ACTIVE", response.getFirst().metadata().get("status"));
	}

	@Test
	public void listRecentReturnsMetadataErrorOnInvalidJson() {
		AdminAuditLogEntity entity = new AdminAuditLogEntity("admin-user", "DISPLAY_UPDATED", "display", "display-1",
				"{broken");
		when(repository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(List.of(entity));

		var response = service.listRecent(5);

		assertEquals(1, response.size());
		assertEquals("metadata_unavailable", response.getFirst().metadata().get("error"));
		assertNotNull(response.getFirst().createdAt());
	}
}
