package com.schooldashboard.display.service;

import com.schooldashboard.display.config.DisplayAdminAuthProperties;
import com.schooldashboard.display.web.DisplayDomainException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AdminAuthService {

	private final DisplayAdminAuthProperties authProperties;

	public AdminAuthService(DisplayAdminAuthProperties authProperties) {
		this.authProperties = authProperties;
	}

	public String requireAdmin(String tokenHeader, String adminIdHeader) {
		String expectedToken = authProperties.getApiToken();
		String providedToken = tokenHeader == null ? "" : tokenHeader.trim();

		if (expectedToken == null || expectedToken.isBlank()) {
			throw new DisplayDomainException("ADMIN_AUTH_CONFIG_INVALID", HttpStatus.INTERNAL_SERVER_ERROR,
					"Admin auth token is not configured");
		}

		if (!constantTimeEquals(expectedToken, providedToken)) {
			throw new DisplayDomainException("ADMIN_UNAUTHORIZED", HttpStatus.UNAUTHORIZED,
					"Admin authentication failed");
		}

		if (adminIdHeader == null || adminIdHeader.isBlank()) {
			return "admin";
		}
		return adminIdHeader.trim();
	}

	private boolean constantTimeEquals(String left, String right) {
		byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
		byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);
		return MessageDigest.isEqual(leftBytes, rightBytes);
	}
}
