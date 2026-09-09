package com.schooldashboard.warning.model;

import java.time.Instant;
import java.util.List;

public record WarningNotice(String id, String messageType, String headline, String description, String instruction,
		String provider, String severity, String urgency, String certainty, String event, List<String> affectedAreas,
		Instant sentAt, Instant expiresAt, String sourceUrl, boolean test) {

	public WarningNotice {
		affectedAreas = affectedAreas == null ? List.of() : List.copyOf(affectedAreas);
	}

	public boolean isCancellation() {
		return "cancel".equalsIgnoreCase(messageType);
	}

	public boolean isExpired(Instant now) {
		return expiresAt != null && !expiresAt.isAfter(now);
	}
}
