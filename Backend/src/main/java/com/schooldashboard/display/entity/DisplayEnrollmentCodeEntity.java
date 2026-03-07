package com.schooldashboard.display.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "display_enrollment_code")
public class DisplayEnrollmentCodeEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@Column(name = "code_hash", nullable = false, length = 128)
	private String codeHash;

	@Column(name = "created_by_admin_id", length = 120)
	private String createdByAdminId;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "max_uses", nullable = false)
	private int maxUses;

	@Column(name = "uses_count", nullable = false)
	private int usesCount;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 32)
	private EnrollmentCodeStatus status;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected DisplayEnrollmentCodeEntity() {
		// JPA
	}

	public DisplayEnrollmentCodeEntity(String codeHash, String createdByAdminId, Instant expiresAt, int maxUses) {
		this.id = UUID.randomUUID().toString();
		this.codeHash = codeHash;
		this.createdByAdminId = createdByAdminId;
		this.expiresAt = expiresAt;
		this.maxUses = maxUses;
		this.usesCount = 0;
		this.status = EnrollmentCodeStatus.ACTIVE;
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
		if (status == null) {
			status = EnrollmentCodeStatus.ACTIVE;
		}
	}

	public String getId() {
		return id;
	}

	public String getCodeHash() {
		return codeHash;
	}

	public String getCreatedByAdminId() {
		return createdByAdminId;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public int getMaxUses() {
		return maxUses;
	}

	public int getUsesCount() {
		return usesCount;
	}

	public void setUsesCount(int usesCount) {
		this.usesCount = usesCount;
	}

	public EnrollmentCodeStatus getStatus() {
		return status;
	}

	public void setStatus(EnrollmentCodeStatus status) {
		this.status = status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
