package com.schooldashboard.display.dto;

import com.schooldashboard.display.entity.DisplayStatus;

public record UpdateDisplayRequest(String name, String slug, String locationLabel, String assignedProfileId,
		DisplayStatus status) {
}
