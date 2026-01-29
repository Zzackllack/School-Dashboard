package com.schooldashboard.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;

@Entity
@Table(name = "api_response_cache")
public class ApiResponseCache {

	@Id
	@Column(name = "cache_key", nullable = false, length = 128)
	private String cacheKey;

	@Lob
	@Column(name = "json_body", nullable = false)
	private String jsonBody;

	@Column(name = "content_hash", nullable = false, length = 64)
	private String contentHash;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Version
	@Column(name = "version", nullable = false)
	private long version;

	protected ApiResponseCache() {
		// JPA
	}

	public ApiResponseCache(String cacheKey, String jsonBody, String contentHash) {
		this.cacheKey = cacheKey;
		this.jsonBody = jsonBody;
		this.contentHash = contentHash;
		this.updatedAt = Instant.now();
	}

	@PrePersist
	void onCreate() {
		if (updatedAt == null) {
			updatedAt = Instant.now();
		}
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public String getCacheKey() {
		return cacheKey;
	}

	public void setCacheKey(String cacheKey) {
		this.cacheKey = cacheKey;
	}

	public String getJsonBody() {
		return jsonBody;
	}

	public void setJsonBody(String jsonBody) {
		this.jsonBody = jsonBody;
	}

	public String getContentHash() {
		return contentHash;
	}

	public void setContentHash(String contentHash) {
		this.contentHash = contentHash;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}

	public long getVersion() {
		return version;
	}
}
