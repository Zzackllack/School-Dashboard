package com.schooldashboard.display.dto;

import java.time.Instant;

public record PendingEnrollmentResponse(String requestId, String enrollmentCodeId, String proposedDisplayName,
		Object deviceInfo, String status, String displayId, Instant createdAt, Instant expiresAt) {
}
