package com.schooldashboard.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.persistence.entity.ApiResponseCache;
import com.schooldashboard.persistence.repository.ApiResponseCacheRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;

@Service
public class ApiResponseCacheService {

	private static final char[] HEX_ARRAY = "0123456789abcdef".toCharArray();

	private final ApiResponseCacheRepository repository;
	private final ObjectMapper objectMapper;

	public ApiResponseCacheService(ApiResponseCacheRepository repository, ObjectMapper objectMapper) {
		this.repository = repository;
		this.objectMapper = objectMapper;
	}

	public void store(String cacheKey, Object payload) {
		if (cacheKey == null || cacheKey.isBlank() || payload == null) {
			return;
		}

		String json = toJson(payload);
		if (json == null || json.isBlank()) {
			return;
		}

		String contentHash = hashContent(json);
		for (int attempt = 0; attempt < 2; attempt++) {
			Optional<ApiResponseCache> existing = repository.findById(cacheKey);
			if (existing.isPresent()) {
				ApiResponseCache entry = existing.get();
				if (contentHash.equals(entry.getContentHash())) {
					return;
				}
				entry.setJsonBody(json);
				entry.setContentHash(contentHash);
				try {
					repository.save(entry);
					return;
				} catch (OptimisticLockingFailureException ex) {
					if (attempt == 1) {
						throw ex;
					}
				}
			} else {
				try {
					repository.save(new ApiResponseCache(cacheKey, json, contentHash));
					return;
				} catch (DataIntegrityViolationException ex) {
					if (attempt == 1) {
						throw ex;
					}
				}
			}
		}
	}

	public Optional<String> getRawJson(String cacheKey) {
		if (cacheKey == null || cacheKey.isBlank()) {
			return Optional.empty();
		}
		return repository.findById(cacheKey).map(ApiResponseCache::getJsonBody);
	}

	public Optional<JsonNode> getJson(String cacheKey) {
		Optional<String> json = getRawJson(cacheKey);
		if (json.isEmpty()) {
			return Optional.empty();
		}
		try {
			return Optional.of(objectMapper.readTree(json.get()));
		} catch (JsonProcessingException ex) {
			return Optional.empty();
		}
	}

	private String toJson(Object payload) {
		try {
			return objectMapper.writeValueAsString(payload);
		} catch (JsonProcessingException ex) {
			return null;
		}
	}

	private String hashContent(String content) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(content.getBytes(StandardCharsets.UTF_8));
			return toHex(hashBytes);
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm is not available", e);
		}
	}

	private String toHex(byte[] bytes) {
		char[] hexChars = new char[bytes.length * 2];
		for (int j = 0; j < bytes.length; j++) {
			int v = bytes[j] & 0xFF;
			hexChars[j * 2] = HEX_ARRAY[v >>> 4];
			hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
		}
		return new String(hexChars);
	}
}
