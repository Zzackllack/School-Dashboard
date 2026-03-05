package com.schooldashboard.display.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CreateEnrollmentCodeRequest(@NotNull @Min(1) Integer ttlSeconds, @NotNull @Min(1) Integer maxUses) {
}
