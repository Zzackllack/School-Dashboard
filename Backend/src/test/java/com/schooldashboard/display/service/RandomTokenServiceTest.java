package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

public class RandomTokenServiceTest {

	@Test
	public void rejectsNonPositiveLength() {
		RandomTokenService service = new RandomTokenService();
		assertThrows(IllegalArgumentException.class, () -> service.nextEnrollmentCode(0));
	}

	@Test
	public void generatesTokenOfRequestedLength() {
		RandomTokenService service = new RandomTokenService();
		String token = service.nextSessionToken(64);
		assertTrue(token.length() == 64);
	}
}
