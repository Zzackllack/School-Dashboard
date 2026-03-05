package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

public class RandomTokenServiceTest {

	@Test
	public void rejectsNonPositiveLength() {
		RandomTokenService service = new RandomTokenService();
		assertThrows(IllegalArgumentException.class, () -> service.nextEnrollmentCode(0));
		assertThrows(IllegalArgumentException.class, () -> service.nextEnrollmentCode(-1));
		assertThrows(IllegalArgumentException.class, () -> service.nextSessionToken(-1));
	}

	@Test
	public void rejectsOversizedLength() {
		RandomTokenService service = new RandomTokenService();
		assertThrows(IllegalArgumentException.class, () -> service.nextEnrollmentCode(Integer.MAX_VALUE));
		assertThrows(IllegalArgumentException.class, () -> service.nextSessionToken(Integer.MAX_VALUE));
	}

	@Test
	public void generatesTokenOfRequestedLength() {
		RandomTokenService service = new RandomTokenService();
		String token = service.nextSessionToken(64);
		assertTrue(token.length() == 64);
	}
}
