package com.schooldashboard.display.dto;

import java.time.Instant;

public record CreateEnrollmentCodeResponse(String codeId, String code, Instant expiresAt, int maxUses) {
}
