package com.schooldashboard.display.dto;

public record UpdateDisplayRequest(String name, String slug, String locationLabel, String assignedProfileId,
		String status) {
}
