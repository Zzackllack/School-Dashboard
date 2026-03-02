package com.schooldashboard.display.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "display")
public class DisplayEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@Column(name = "name", nullable = false, length = 120)
	private String name;

	@Column(name = "slug", nullable = false, length = 160)
	private String slug;

	@Column(name = "location_label", length = 160)
	private String locationLabel;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 32)
	private DisplayStatus status;

	@Column(name = "assigned_profile_id", length = 120)
	private String assignedProfileId;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected DisplayEntity() {
		// JPA
	}

	public DisplayEntity(String name, String slug, String locationLabel, String assignedProfileId) {
		this.id = UUID.randomUUID().toString();
		this.name = name;
		this.slug = slug;
		this.locationLabel = locationLabel;
		this.status = DisplayStatus.ACTIVE;
		this.assignedProfileId = assignedProfileId;
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
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
		if (updatedAt == null) {
			updatedAt = createdAt;
		}
		if (status == null) {
			status = DisplayStatus.ACTIVE;
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

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getSlug() {
		return slug;
	}

	public void setSlug(String slug) {
		this.slug = slug;
	}

	public String getLocationLabel() {
		return locationLabel;
	}

	public void setLocationLabel(String locationLabel) {
		this.locationLabel = locationLabel;
	}

	public DisplayStatus getStatus() {
		return status;
	}

	public void setStatus(DisplayStatus status) {
		this.status = status;
	}

	public String getAssignedProfileId() {
		return assignedProfileId;
	}

	public void setAssignedProfileId(String assignedProfileId) {
		this.assignedProfileId = assignedProfileId;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
