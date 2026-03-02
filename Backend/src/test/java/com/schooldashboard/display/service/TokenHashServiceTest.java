package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.*;

import com.schooldashboard.display.web.DisplayDomainException;
import org.junit.jupiter.api.Test;

public class TokenHashServiceTest {

	private final TokenHashService tokenHashService = new TokenHashService();

	@Test
	public void hashReturnsStableSha256Hash() {
		String firstHash = tokenHashService.hash("sample-token");
		String secondHash = tokenHashService.hash("sample-token");

		assertEquals(firstHash, secondHash);
		assertEquals(64, firstHash.length());
	}

	@Test
	public void hashRejectsBlankValue() {
		DisplayDomainException exception = assertThrows(DisplayDomainException.class, () -> tokenHashService.hash("   "));
		assertEquals("DISPLAY_TOKEN_INVALID", exception.getCode());
	}
}
