package com.schooldashboard.display.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateEnrollmentCodeRequest(@NotNull @Min(1) @Max(31536000) Integer ttlSeconds,
		@NotNull @Min(1) @Max(10000) Integer maxUses) {
}
