package com.schooldashboard.display.dto;

public record DisplaySessionValidationResponse(boolean valid, String displayId, String displaySlug,
		String assignedProfileId, String redirectPath) {
}
