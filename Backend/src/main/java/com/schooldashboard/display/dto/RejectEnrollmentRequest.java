package com.schooldashboard.display.dto;

import java.util.Objects;

public record RejectEnrollmentRequest(String reason) {

	public RejectEnrollmentRequest {
		Objects.requireNonNull(reason, "reason must not be null");
		if (reason.isBlank()) {
			throw new IllegalArgumentException("reason must not be blank");
		}
	}
}
