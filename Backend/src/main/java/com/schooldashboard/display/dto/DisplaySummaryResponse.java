package com.schooldashboard.display.dto;

import java.time.Instant;

public record DisplaySummaryResponse(String id, String name, String slug, String locationLabel, String status,
		String assignedProfileId, String themeId, Instant updatedAt) {
}
