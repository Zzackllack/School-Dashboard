package com.schooldashboard.display.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

public class DisplayEnrollmentPropertiesTest {

	@Test
	public void defaultsDisplaySessionsToEffectivelyPermanentTtl() {
		DisplayEnrollmentProperties properties = new DisplayEnrollmentProperties();
		assertEquals(Integer.MAX_VALUE, properties.getSessionTtlSeconds());
	}
}
