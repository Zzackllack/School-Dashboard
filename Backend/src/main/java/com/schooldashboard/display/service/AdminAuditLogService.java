package com.schooldashboard.display.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.entity.AdminAuditLogEntity;
import com.schooldashboard.display.repository.AdminAuditLogRepository;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class AdminAuditLogService {

	private final AdminAuditLogRepository auditLogRepository;
	private final ObjectMapper objectMapper;

	public AdminAuditLogService(AdminAuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
		this.auditLogRepository = auditLogRepository;
		this.objectMapper = objectMapper;
	}

	public void log(String adminId, String action, String targetType, String targetId, Map<String, Object> metadata) {
		auditLogRepository.save(new AdminAuditLogEntity(adminId, action, targetType, targetId, serialize(metadata)));
	}

	private String serialize(Map<String, Object> metadata) {
		if (metadata == null || metadata.isEmpty()) {
			return null;
		}
		try {
			return objectMapper.writeValueAsString(metadata);
		} catch (JsonProcessingException exception) {
			return "{\"error\":\"metadata_unavailable\"}";
		}
	}
}
