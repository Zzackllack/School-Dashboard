package com.schooldashboard.display.dto;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

public class RejectEnrollmentRequestTest {

	@Test
	public void rejectsNullReason() {
		assertThrows(NullPointerException.class, () -> new RejectEnrollmentRequest(null));
	}

	@Test
	public void rejectsBlankReason() {
		assertThrows(IllegalArgumentException.class, () -> new RejectEnrollmentRequest("   "));
	}
}
