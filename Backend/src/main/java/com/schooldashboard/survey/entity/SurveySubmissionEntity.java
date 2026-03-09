package com.schooldashboard.survey.entity;

import com.schooldashboard.display.entity.DisplayEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "survey_submissions")
public class SurveySubmissionEntity {

	@Id
	@Column(name = "id", nullable = false, length = 36)
	private String id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "display_id", nullable = false)
	private DisplayEntity display;

	@Enumerated(EnumType.STRING)
	@Column(name = "category", nullable = false, length = 40)
	private SurveyCategory category;

	@Column(name = "message", nullable = false, length = 2000)
	private String message;

	@Column(name = "submitter_name", length = 160)
	private String submitterName;

	@Column(name = "school_class", length = 40)
	private String schoolClass;

	@Column(name = "contact_allowed", nullable = false)
	private boolean contactAllowed;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "source_ip_hash", nullable = false, length = 128)
	private String sourceIpHash;

	protected SurveySubmissionEntity() {
	}

	public SurveySubmissionEntity(DisplayEntity display, SurveyCategory category, String message, String submitterName,
			String schoolClass, boolean contactAllowed, String sourceIpHash) {
		this.id = UUID.randomUUID().toString();
		this.display = display;
		this.category = category;
		this.message = message;
		this.submitterName = submitterName;
		this.schoolClass = schoolClass;
		this.contactAllowed = contactAllowed;
		this.sourceIpHash = sourceIpHash;
		this.createdAt = Instant.now();
	}

	@PrePersist
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

	public DisplayEntity getDisplay() {
		return display;
	}

	public SurveyCategory getCategory() {
		return category;
	}

	public String getMessage() {
		return message;
	}

	public String getSubmitterName() {
		return submitterName;
	}

	public String getSchoolClass() {
		return schoolClass;
	}

	public boolean isContactAllowed() {
		return contactAllowed;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public String getSourceIpHash() {
		return sourceIpHash;
	}
}
