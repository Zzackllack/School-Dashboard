package com.schooldashboard.display.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
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
		this.displayId = requireNonBlank(displayId, "displayId");
		this.tokenHash = requireNonBlank(tokenHash, "tokenHash");
		this.issuedAt = Objects.requireNonNull(issuedAt, "issuedAt must not be null");
		this.expiresAt = Objects.requireNonNull(expiresAt, "expiresAt must not be null");
		validateTimestampOrder(this.issuedAt, this.expiresAt);
		this.lastSeenAt = this.issuedAt;
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

	public void setTokenHash(String tokenHash) {
		this.tokenHash = requireNonBlank(tokenHash, "tokenHash");
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
		if (lastSeenAt == null) {
			throw new IllegalArgumentException("lastSeenAt must not be null");
		}
		if (issuedAt != null && lastSeenAt.isBefore(issuedAt)) {
			throw new IllegalArgumentException("lastSeenAt must be on or after issuedAt");
		}
		if (expiresAt != null && lastSeenAt.isAfter(expiresAt)) {
			throw new IllegalArgumentException("lastSeenAt must be on or before expiresAt");
		}
		this.lastSeenAt = lastSeenAt;
	}

	public void setIssuedAt(Instant issuedAt) {
		Instant resolvedIssuedAt = Objects.requireNonNull(issuedAt, "issuedAt must not be null");
		validateTimestampOrder(resolvedIssuedAt, this.expiresAt);
		if (this.lastSeenAt != null && this.lastSeenAt.isBefore(resolvedIssuedAt)) {
			throw new IllegalArgumentException("lastSeenAt must be on or after issuedAt");
		}
		this.issuedAt = resolvedIssuedAt;
	}

	public void setExpiresAt(Instant expiresAt) {
		Instant resolvedExpiresAt = Objects.requireNonNull(expiresAt, "expiresAt must not be null");
		validateTimestampOrder(this.issuedAt, resolvedExpiresAt);
		if (this.lastSeenAt != null && this.lastSeenAt.isAfter(resolvedExpiresAt)) {
			throw new IllegalArgumentException("lastSeenAt must be on or before expiresAt");
		}
		this.expiresAt = resolvedExpiresAt;
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

	private void validateTimestampOrder(Instant issuedAt, Instant expiresAt) {
		if (issuedAt != null && expiresAt != null && !expiresAt.isAfter(issuedAt)) {
			throw new IllegalArgumentException("expiresAt must be after issuedAt");
		}
	}

	private String requireNonBlank(String value, String fieldName) {
		if (value == null || value.isBlank()) {
			throw new IllegalArgumentException(fieldName + " must not be null or blank");
		}
		return value;
	}
}
