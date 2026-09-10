package com.schooldashboard.warning.model;

import java.time.Instant;
import java.util.List;

public record WarningSnapshot(Instant lastCheckedAt, Instant lastSuccessfulSyncAt, boolean sourceAvailable,
		List<WarningNotice> warnings) {

	public WarningSnapshot {
		warnings = warnings == null ? List.of() : List.copyOf(warnings);
	}

	public static WarningSnapshot empty() {
		return new WarningSnapshot(null, null, false, List.of());
	}
}
