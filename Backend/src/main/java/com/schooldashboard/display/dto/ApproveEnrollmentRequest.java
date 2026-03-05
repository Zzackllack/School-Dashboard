package com.schooldashboard.display.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ApproveEnrollmentRequest(@Size(max = 120) String assignedProfileId, @Size(max = 160) String locationLabel,
		@Size(max = 120) String displayName,
		@Pattern(regexp = "^[a-zA-Z0-9-]*$", message = "displaySlug may only contain letters, numbers, and hyphens") @Size(max = 160) String displaySlug) {
}
