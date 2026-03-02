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
@Table(name = "display_enrollment_request")
public class DisplayEnrollmentRequestEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@Column(name = "enrollment_code_id", nullable = false, length = 36)
	private String enrollmentCodeId;

	@Column(name = "proposed_display_name", nullable = false, length = 160)
	private String proposedDisplayName;

	@Column(name = "device_info_json")
	private String deviceInfoJson;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 32)
	private EnrollmentRequestStatus status;

	@Column(name = "display_id", length = 36)
	private String displayId;

	@Column(name = "issued_session_token", length = 256)
	private String issuedSessionToken;

	@Column(name = "approved_by_admin_id", length = 120)
	private String approvedByAdminId;

	@Column(name = "approved_at")
	private Instant approvedAt;

	@Column(name = "rejected_at")
	private Instant rejectedAt;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected DisplayEnrollmentRequestEntity() {
		// JPA
	}

	public DisplayEnrollmentRequestEntity(String enrollmentCodeId, String proposedDisplayName, String deviceInfoJson,
			Instant expiresAt) {
		this.id = UUID.randomUUID().toString();
		this.enrollmentCodeId = enrollmentCodeId;
		this.proposedDisplayName = proposedDisplayName;
		this.deviceInfoJson = deviceInfoJson;
		this.status = EnrollmentRequestStatus.PENDING;
		this.expiresAt = expiresAt;
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
			status = EnrollmentRequestStatus.PENDING;
		}
	}

	public String getId() {
		return id;
	}

	public String getEnrollmentCodeId() {
		return enrollmentCodeId;
	}

	public String getProposedDisplayName() {
		return proposedDisplayName;
	}

	public String getDeviceInfoJson() {
		return deviceInfoJson;
	}

	public EnrollmentRequestStatus getStatus() {
		return status;
	}

	public void setStatus(EnrollmentRequestStatus status) {
		this.status = status;
	}

	public String getDisplayId() {
		return displayId;
	}

	public void setDisplayId(String displayId) {
		this.displayId = displayId;
	}

	public String getIssuedSessionToken() {
		return issuedSessionToken;
	}

	public void setIssuedSessionToken(String issuedSessionToken) {
		this.issuedSessionToken = issuedSessionToken;
	}

	public String getApprovedByAdminId() {
		return approvedByAdminId;
	}

	public void setApprovedByAdminId(String approvedByAdminId) {
		this.approvedByAdminId = approvedByAdminId;
	}

	public Instant getApprovedAt() {
		return approvedAt;
	}

	public void setApprovedAt(Instant approvedAt) {
		this.approvedAt = approvedAt;
	}

	public Instant getRejectedAt() {
		return rejectedAt;
	}

	public void setRejectedAt(Instant rejectedAt) {
		this.rejectedAt = rejectedAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
