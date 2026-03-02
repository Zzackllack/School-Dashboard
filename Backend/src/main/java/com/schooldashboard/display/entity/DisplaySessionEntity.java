package com.schooldashboard.display.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "display_session")
public class DisplaySessionEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@Column(name = "display_id", nullable = false, length = 36)
	private String displayId;

	@Column(name = "token_hash", nullable = false, length = 128)
	private String tokenHash;

	@Column(name = "issued_at", nullable = false)
	private Instant issuedAt;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "last_seen_at")
	private Instant lastSeenAt;

	@Column(name = "revoked_at")
	private Instant revokedAt;

	@Column(name = "revoked_by_admin_id", length = 120)
	private String revokedByAdminId;

	protected DisplaySessionEntity() {
		// JPA
	}

	public DisplaySessionEntity(String displayId, String tokenHash, Instant issuedAt, Instant expiresAt) {
		this.id = UUID.randomUUID().toString();
		this.displayId = displayId;
		this.tokenHash = tokenHash;
		this.issuedAt = issuedAt;
		this.expiresAt = expiresAt;
		this.lastSeenAt = issuedAt;
	}

	@PrePersist
	@SuppressWarnings("unused")
	void onCreate() {
		if (id == null) {
			id = UUID.randomUUID().toString();
		}
		if (issuedAt == null) {
			issuedAt = Instant.now();
		}
		if (lastSeenAt == null) {
			lastSeenAt = issuedAt;
		}
	}

	public String getId() {
		return id;
	}

	public String getDisplayId() {
		return displayId;
	}

	public String getTokenHash() {
		return tokenHash;
	}

	public Instant getIssuedAt() {
		return issuedAt;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getLastSeenAt() {
		return lastSeenAt;
	}

	public void setLastSeenAt(Instant lastSeenAt) {
		this.lastSeenAt = lastSeenAt;
	}

	public Instant getRevokedAt() {
		return revokedAt;
	}

	public void setRevokedAt(Instant revokedAt) {
		this.revokedAt = revokedAt;
	}

	public String getRevokedByAdminId() {
		return revokedByAdminId;
	}

	public void setRevokedByAdminId(String revokedByAdminId) {
		this.revokedByAdminId = revokedByAdminId;
	}
}
