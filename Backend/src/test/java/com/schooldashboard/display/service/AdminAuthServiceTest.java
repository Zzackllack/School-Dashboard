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
		properties.setApiPassword("1234");
		AdminAuthService service = new AdminAuthService(properties);

		String adminId = service.requireAdmin("top-secret", "1234", "ops-admin");
		assertEquals("ops-admin", adminId);
	}

	@Test
	public void requireAdminFallsBackToDefaultAdminId() {
		DisplayAdminAuthProperties properties = new DisplayAdminAuthProperties();
		properties.setApiToken("top-secret");
		properties.setApiPassword("1234");
		AdminAuthService service = new AdminAuthService(properties);

		String adminId = service.requireAdmin("top-secret", "1234", "  ");
		assertEquals("admin", adminId);
	}

	@Test
	public void requireAdminRejectsInvalidToken() {
		DisplayAdminAuthProperties properties = new DisplayAdminAuthProperties();
		properties.setApiToken("top-secret");
		properties.setApiPassword("1234");
		AdminAuthService service = new AdminAuthService(properties);

		DisplayDomainException exception = assertThrows(DisplayDomainException.class,
				() -> service.requireAdmin("invalid", "1234", "ops-admin"));
		assertEquals("ADMIN_UNAUTHORIZED", exception.getCode());
	}

	@Test
	public void requireAdminRejectsInvalidPassword() {
		DisplayAdminAuthProperties properties = new DisplayAdminAuthProperties();
		properties.setApiToken("top-secret");
		properties.setApiPassword("1234");
		AdminAuthService service = new AdminAuthService(properties);

		DisplayDomainException exception = assertThrows(DisplayDomainException.class,
				() -> service.requireAdmin("top-secret", "0000", "ops-admin"));
		assertEquals("ADMIN_UNAUTHORIZED", exception.getCode());
	}
}
