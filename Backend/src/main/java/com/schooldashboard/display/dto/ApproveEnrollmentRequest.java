package com.schooldashboard.display.dto;

public record ApproveEnrollmentRequest(String assignedProfileId, String locationLabel, String displayName,
		String displaySlug) {
}
