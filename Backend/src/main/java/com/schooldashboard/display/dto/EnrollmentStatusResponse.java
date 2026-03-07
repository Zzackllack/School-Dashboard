package com.schooldashboard.display.dto;

public record EnrollmentStatusResponse(String requestId, String status, String displayId, String displaySessionToken,
		Integer pollAfterSeconds) {
}
