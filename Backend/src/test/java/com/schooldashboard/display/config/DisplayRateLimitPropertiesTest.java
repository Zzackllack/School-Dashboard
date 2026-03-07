package com.schooldashboard.display.config;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

public class DisplayRateLimitPropertiesTest {

	@Test
	public void rejectsNonPositiveEnrollmentRate() {
		DisplayRateLimitProperties properties = new DisplayRateLimitProperties();
		assertThrows(IllegalArgumentException.class, () -> properties.setEnrollmentsPerMinute(0));
	}

	@Test
	public void rejectsNonPositiveSessionValidationRate() {
		DisplayRateLimitProperties properties = new DisplayRateLimitProperties();
		assertThrows(IllegalArgumentException.class, () -> properties.setSessionValidationsPerMinute(-1));
	}
}
