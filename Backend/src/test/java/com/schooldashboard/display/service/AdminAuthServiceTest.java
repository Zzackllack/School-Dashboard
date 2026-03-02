package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.*;

import com.schooldashboard.display.config.DisplayAdminAuthProperties;
import com.schooldashboard.display.web.DisplayDomainException;
import org.junit.jupiter.api.Test;

public class AdminAuthServiceTest {

	@Test
	public void requireAdminReturnsProvidedAdminIdWhenTokenMatches() {
		DisplayAdminAuthProperties properties = new DisplayAdminAuthProperties();
		properties.setApiToken("top-secret");
		AdminAuthService service = new AdminAuthService(properties);

		String adminId = service.requireAdmin("top-secret", "ops-admin");
		assertEquals("ops-admin", adminId);
	}

	@Test
	public void requireAdminFallsBackToDefaultAdminId() {
		DisplayAdminAuthProperties properties = new DisplayAdminAuthProperties();
		properties.setApiToken("top-secret");
		AdminAuthService service = new AdminAuthService(properties);

		String adminId = service.requireAdmin("top-secret", "  ");
		assertEquals("admin", adminId);
	}

	@Test
	public void requireAdminRejectsInvalidToken() {
		DisplayAdminAuthProperties properties = new DisplayAdminAuthProperties();
		properties.setApiToken("top-secret");
		AdminAuthService service = new AdminAuthService(properties);

		DisplayDomainException exception = assertThrows(DisplayDomainException.class,
				() -> service.requireAdmin("invalid", "ops-admin"));
		assertEquals("ADMIN_UNAUTHORIZED", exception.getCode());
	}
}
