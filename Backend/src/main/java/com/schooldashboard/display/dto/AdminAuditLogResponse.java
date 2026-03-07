package com.schooldashboard.display.dto;

import java.time.Instant;
import java.util.Map;

public record AdminAuditLogResponse(String id, String adminId, String action, String targetType, String targetId,
		Map<String, Object> metadata, Instant createdAt) {
}
