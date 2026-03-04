package com.schooldashboard.security.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "app_user")
public class AppUserEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@Column(name = "username", nullable = false, unique = true, length = 120, updatable = false)
	private String username;

	@Column(name = "password_hash", nullable = false, length = 255)
	private String passwordHash;

	@Column(name = "enabled", nullable = false)
	private boolean enabled;

	@Column(name = "locked", nullable = false)
	private boolean locked;

	@Column(name = "failed_login_count", nullable = false)
	private int failedLoginCount;

	@Column(name = "last_failed_login_at")
	private Instant lastFailedLoginAt;

	@Column(name = "locked_until")
	private Instant lockedUntil;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(name = "app_user_role", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
	private Set<AppRoleEntity> roles = new LinkedHashSet<>();

	protected AppUserEntity() {
		// JPA
	}

	public AppUserEntity(String username, String passwordHash) {
		this.id = UUID.randomUUID().toString();
		this.username = username;
		this.passwordHash = passwordHash;
		this.enabled = true;
		this.locked = false;
		this.failedLoginCount = 0;
	}

	@PrePersist
	@SuppressWarnings("unused")
	void onCreate() {
		Instant now = Instant.now();
		if (id == null) {
			id = UUID.randomUUID().toString();
		}
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
	}

	@PreUpdate
	@SuppressWarnings("unused")
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public String getId() {
		return id;
	}

	public String getUsername() {
		return username;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public boolean isLocked() {
		return locked;
	}

	public void setLocked(boolean locked) {
		this.locked = locked;
	}

	public int getFailedLoginCount() {
		return failedLoginCount;
	}

	public void setFailedLoginCount(int failedLoginCount) {
		this.failedLoginCount = failedLoginCount;
	}

	public Instant getLastFailedLoginAt() {
		return lastFailedLoginAt;
	}

	public void setLastFailedLoginAt(Instant lastFailedLoginAt) {
		this.lastFailedLoginAt = lastFailedLoginAt;
	}

	public Instant getLockedUntil() {
		return lockedUntil;
	}

	public void setLockedUntil(Instant lockedUntil) {
		this.lockedUntil = lockedUntil;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public Set<AppRoleEntity> getRoles() {
		return roles;
	}

	public void addRole(AppRoleEntity role) {
		roles.add(role);
	}
}
