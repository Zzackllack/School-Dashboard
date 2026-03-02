package com.schooldashboard.display.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "admin_audit_log")
public class AdminAuditLogEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@Column(name = "admin_id", nullable = false, length = 120)
	private String adminId;

	@Column(name = "action", nullable = false, length = 64)
	private String action;

	@Column(name = "target_type", nullable = false, length = 64)
	private String targetType;

	@Column(name = "target_id", nullable = false, length = 120)
	private String targetId;

	@Column(name = "metadata_json")
	private String metadataJson;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected AdminAuditLogEntity() {
		// JPA
	}

	public AdminAuditLogEntity(String adminId, String action, String targetType, String targetId, String metadataJson) {
		this.id = UUID.randomUUID().toString();
		this.adminId = adminId;
		this.action = action;
		this.targetType = targetType;
		this.targetId = targetId;
		this.metadataJson = metadataJson;
		this.createdAt = Instant.now();
	}

	@PrePersist
	@SuppressWarnings("unused")
	void onCreate() {
		if (id == null) {
			id = UUID.randomUUID().toString();
		}
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public String getId() {
		return id;
	}

	public String getAdminId() {
		return adminId;
	}

	public String getAction() {
		return action;
	}

	public String getTargetType() {
		return targetType;
	}

	public String getTargetId() {
		return targetId;
	}

	public String getMetadataJson() {
		return metadataJson;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
