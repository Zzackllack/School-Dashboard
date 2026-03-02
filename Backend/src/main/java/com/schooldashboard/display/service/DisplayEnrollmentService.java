package com.schooldashboard.display.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.config.DisplayEnrollmentProperties;
import com.schooldashboard.display.dto.ApproveEnrollmentRequest;
import com.schooldashboard.display.dto.CreateEnrollmentCodeRequest;
import com.schooldashboard.display.dto.CreateEnrollmentCodeResponse;
import com.schooldashboard.display.dto.CreateEnrollmentRequest;
import com.schooldashboard.display.dto.CreateEnrollmentResponse;
import com.schooldashboard.display.dto.DisplaySessionValidationResponse;
import com.schooldashboard.display.dto.DisplaySummaryResponse;
import com.schooldashboard.display.dto.EnrollmentStatusResponse;
import com.schooldashboard.display.dto.PendingEnrollmentResponse;
import com.schooldashboard.display.dto.RejectEnrollmentRequest;
import com.schooldashboard.display.dto.UpdateDisplayRequest;
import com.schooldashboard.display.entity.DisplayEnrollmentCodeEntity;
import com.schooldashboard.display.entity.DisplayEnrollmentRequestEntity;
import com.schooldashboard.display.entity.DisplayEntity;
import com.schooldashboard.display.entity.DisplaySessionEntity;
import com.schooldashboard.display.entity.DisplayStatus;
import com.schooldashboard.display.entity.EnrollmentCodeStatus;
import com.schooldashboard.display.entity.EnrollmentRequestStatus;
import com.schooldashboard.display.repository.DisplayEnrollmentCodeRepository;
import com.schooldashboard.display.repository.DisplayEnrollmentRequestRepository;
import com.schooldashboard.display.repository.DisplayRepository;
import com.schooldashboard.display.repository.DisplaySessionRepository;
import com.schooldashboard.display.web.DisplayDomainException;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisplayEnrollmentService {

	private static final Logger logger = LoggerFactory.getLogger(DisplayEnrollmentService.class);

	private final DisplayEnrollmentCodeRepository enrollmentCodeRepository;
	private final DisplayEnrollmentRequestRepository enrollmentRequestRepository;
	private final DisplayRepository displayRepository;
	private final DisplaySessionRepository sessionRepository;
	private final DisplayEnrollmentProperties enrollmentProperties;
	private final TokenHashService tokenHashService;
	private final RandomTokenService randomTokenService;
	private final SlugService slugService;
	private final AdminAuditLogService auditLogService;
	private final ObjectMapper objectMapper;

	public DisplayEnrollmentService(DisplayEnrollmentCodeRepository enrollmentCodeRepository,
			DisplayEnrollmentRequestRepository enrollmentRequestRepository, DisplayRepository displayRepository,
			DisplaySessionRepository sessionRepository, DisplayEnrollmentProperties enrollmentProperties,
			TokenHashService tokenHashService, RandomTokenService randomTokenService, SlugService slugService,
			AdminAuditLogService auditLogService, ObjectMapper objectMapper) {
		this.enrollmentCodeRepository = enrollmentCodeRepository;
		this.enrollmentRequestRepository = enrollmentRequestRepository;
		this.displayRepository = displayRepository;
		this.sessionRepository = sessionRepository;
		this.enrollmentProperties = enrollmentProperties;
		this.tokenHashService = tokenHashService;
		this.randomTokenService = randomTokenService;
		this.slugService = slugService;
		this.auditLogService = auditLogService;
		this.objectMapper = objectMapper;
	}

	@Transactional
	public CreateEnrollmentCodeResponse createEnrollmentCode(String adminId, CreateEnrollmentCodeRequest request) {
		int ttlSeconds = normalizePositiveInt(request.ttlSeconds(), enrollmentProperties.getCodeTtlSeconds());
		int maxUses = normalizePositiveInt(request.maxUses(), enrollmentProperties.getDefaultCodeMaxUses());
		String code = randomTokenService.nextEnrollmentCode(Math.max(6, enrollmentProperties.getCodeLength()));
		Instant now = Instant.now();
		DisplayEnrollmentCodeEntity codeEntity = new DisplayEnrollmentCodeEntity(tokenHashService.hash(code), adminId,
				now.plusSeconds(ttlSeconds), maxUses);
		enrollmentCodeRepository.save(codeEntity);

		auditLogService.log(adminId, "ENROLLMENT_CODE_CREATED", "display_enrollment_code", codeEntity.getId(),
				Map.of("ttlSeconds", ttlSeconds, "maxUses", maxUses));

		return new CreateEnrollmentCodeResponse(codeEntity.getId(), code, codeEntity.getExpiresAt(), maxUses);
	}

	@Transactional
	public CreateEnrollmentResponse createEnrollmentRequest(CreateEnrollmentRequest request) {
		if (request == null) {
			throw new DisplayDomainException("ENROLLMENT_REQUEST_INVALID", HttpStatus.BAD_REQUEST,
					"Enrollment request body is required");
		}
		String enrollmentCode = trimToNull(request.enrollmentCode());
		if (enrollmentCode == null) {
			throw new DisplayDomainException("ENROLLMENT_CODE_INVALID", HttpStatus.BAD_REQUEST,
					"Enrollment code is required");
		}

		String proposedDisplayName = trimToNull(request.proposedDisplayName());
		if (proposedDisplayName == null) {
			throw new DisplayDomainException("ENROLLMENT_DISPLAY_NAME_INVALID", HttpStatus.BAD_REQUEST,
					"Proposed display name is required");
		}

		DisplayEnrollmentCodeEntity codeEntity = enrollmentCodeRepository
				.findByCodeHash(tokenHashService.hash(enrollmentCode))
				.orElseThrow(() -> new DisplayDomainException("ENROLLMENT_CODE_INVALID", HttpStatus.BAD_REQUEST,
						"Enrollment code is invalid or expired"));

		Instant now = Instant.now();
		expireEnrollmentCodeIfNeeded(codeEntity, now);

		if (codeEntity.getStatus() != EnrollmentCodeStatus.ACTIVE
				|| codeEntity.getUsesCount() >= codeEntity.getMaxUses()) {
			throw new DisplayDomainException("ENROLLMENT_CODE_INVALID", HttpStatus.BAD_REQUEST,
					"Enrollment code is invalid or expired");
		}

		codeEntity.setUsesCount(codeEntity.getUsesCount() + 1);
		if (codeEntity.getUsesCount() >= codeEntity.getMaxUses()) {
			codeEntity.setStatus(EnrollmentCodeStatus.EXPIRED);
		}
		enrollmentCodeRepository.save(codeEntity);

		DisplayEnrollmentRequestEntity requestEntity = new DisplayEnrollmentRequestEntity(codeEntity.getId(),
				proposedDisplayName, serializeJson(request.deviceInfo()),
				now.plusSeconds(enrollmentProperties.getRequestTtlSeconds()));
		enrollmentRequestRepository.save(requestEntity);

		logger.info("Display enrollment requested. requestId={}, codeId={}, name={}", requestEntity.getId(),
				requestEntity.getEnrollmentCodeId(), requestEntity.getProposedDisplayName());

		return new CreateEnrollmentResponse(requestEntity.getId(), requestEntity.getStatus().name(),
				enrollmentProperties.getPollAfterSeconds());
	}

	@Transactional
	public EnrollmentStatusResponse getEnrollmentStatus(String requestId) {
		DisplayEnrollmentRequestEntity requestEntity = findEnrollmentRequest(requestId);
		refreshEnrollmentRequestIfExpired(requestEntity);

		if (requestEntity.getStatus() == EnrollmentRequestStatus.PENDING) {
			return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(), null, null,
					enrollmentProperties.getPollAfterSeconds());
		}

		if (requestEntity.getStatus() == EnrollmentRequestStatus.APPROVED) {
			return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(),
					requestEntity.getDisplayId(), requestEntity.getIssuedSessionToken(), null);
		}

		return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(), null, null, null);
	}

	@Transactional(readOnly = true)
	public List<PendingEnrollmentResponse> listEnrollments(EnrollmentRequestStatus status) {
		return enrollmentRequestRepository.findByStatusOrderByCreatedAtAsc(status).stream()
				.sorted(Comparator.comparing(DisplayEnrollmentRequestEntity::getCreatedAt))
				.map(request -> new PendingEnrollmentResponse(request.getId(), request.getEnrollmentCodeId(),
						request.getProposedDisplayName(), parseJsonObject(request.getDeviceInfoJson()),
						request.getStatus().name(), request.getDisplayId(), request.getCreatedAt(),
						request.getExpiresAt()))
				.toList();
	}

	@Transactional
	public EnrollmentStatusResponse approveEnrollment(String requestId, ApproveEnrollmentRequest request,
			String adminId) {
		DisplayEnrollmentRequestEntity requestEntity = findEnrollmentRequest(requestId);
		refreshEnrollmentRequestIfExpired(requestEntity);
		if (requestEntity.getStatus() != EnrollmentRequestStatus.PENDING) {
			throw new DisplayDomainException("ENROLLMENT_REQUEST_STATE_INVALID", HttpStatus.CONFLICT,
					"Only pending enrollment requests can be approved");
		}

		String resolvedDisplayName = trimToNull(request == null ? null : request.displayName());
		if (resolvedDisplayName == null) {
			resolvedDisplayName = requestEntity.getProposedDisplayName();
		}
		String requestedSlug = trimToNull(request == null ? null : request.displaySlug());
		String resolvedSlug = slugService.createUniqueSlug(requestedSlug == null ? resolvedDisplayName : requestedSlug);

		DisplayEntity display = new DisplayEntity(resolvedDisplayName, resolvedSlug,
				trimToNull(request == null ? null : request.locationLabel()),
				trimToNull(request == null ? null : request.assignedProfileId()));
		displayRepository.save(display);

		Instant now = Instant.now();
		String sessionToken = randomTokenService.nextSessionToken(64);
		DisplaySessionEntity sessionEntity = new DisplaySessionEntity(display.getId(),
				tokenHashService.hash(sessionToken), now, now.plusSeconds(enrollmentProperties.getSessionTtlSeconds()));
		sessionRepository.save(sessionEntity);

		requestEntity.setStatus(EnrollmentRequestStatus.APPROVED);
		requestEntity.setDisplayId(display.getId());
		requestEntity.setIssuedSessionToken(sessionToken);
		requestEntity.setApprovedByAdminId(adminId);
		requestEntity.setApprovedAt(now);
		enrollmentRequestRepository.save(requestEntity);

		auditLogService.log(adminId, "ENROLLMENT_REQUEST_APPROVED", "display_enrollment_request", requestEntity.getId(),
				Map.of("displayId", display.getId(), "displaySlug", display.getSlug()));

		logger.info("Display enrollment approved. requestId={}, displayId={}", requestEntity.getId(), display.getId());

		return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(), display.getId(),
				sessionToken, null);
	}

	@Transactional
	public EnrollmentStatusResponse rejectEnrollment(String requestId, RejectEnrollmentRequest request,
			String adminId) {
		DisplayEnrollmentRequestEntity requestEntity = findEnrollmentRequest(requestId);
		refreshEnrollmentRequestIfExpired(requestEntity);

		if (requestEntity.getStatus() != EnrollmentRequestStatus.PENDING) {
			throw new DisplayDomainException("ENROLLMENT_REQUEST_STATE_INVALID", HttpStatus.CONFLICT,
					"Only pending enrollment requests can be rejected");
		}

		requestEntity.setStatus(EnrollmentRequestStatus.REJECTED);
		requestEntity.setRejectedAt(Instant.now());
		enrollmentRequestRepository.save(requestEntity);

		auditLogService.log(adminId, "ENROLLMENT_REQUEST_REJECTED", "display_enrollment_request", requestEntity.getId(),
				Map.of("reason",
						trimToNull(request == null ? null : request.reason()) == null
								? "unspecified"
								: trimToNull(request.reason())));

		return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(), null, null, null);
	}

	@Transactional
	public DisplaySessionValidationResponse validateSession(String displaySessionToken) {
		String token = trimToNull(displaySessionToken);
		if (token == null) {
			return invalidSessionResponse();
		}

		Optional<DisplaySessionEntity> sessionEntityOpt = sessionRepository
				.findByTokenHash(tokenHashService.hash(token));
		if (sessionEntityOpt.isEmpty()) {
			return invalidSessionResponse();
		}

		DisplaySessionEntity sessionEntity = sessionEntityOpt.get();
		if (sessionEntity.getRevokedAt() != null || sessionEntity.getExpiresAt().isBefore(Instant.now())) {
			return invalidSessionResponse();
		}

		Optional<DisplayEntity> displayEntityOpt = displayRepository.findById(sessionEntity.getDisplayId());
		if (displayEntityOpt.isEmpty()) {
			return invalidSessionResponse();
		}

		DisplayEntity displayEntity = displayEntityOpt.get();
		if (displayEntity.getStatus() != DisplayStatus.ACTIVE) {
			return invalidSessionResponse();
		}

		sessionEntity.setLastSeenAt(Instant.now());
		sessionRepository.save(sessionEntity);
		logger.debug("Display session validated for displayId={}", displayEntity.getId());

		return new DisplaySessionValidationResponse(true, displayEntity.getId(), displayEntity.getSlug(),
				displayEntity.getAssignedProfileId(), "/display/" + displayEntity.getId());
	}

	@Transactional
	public DisplaySummaryResponse revokeDisplaySession(String displayId, String adminId) {
		DisplayEntity displayEntity = displayRepository.findById(displayId).orElseThrow(
				() -> new DisplayDomainException("DISPLAY_NOT_FOUND", HttpStatus.NOT_FOUND, "Display not found"));

		Instant revokedAt = Instant.now();
		List<DisplaySessionEntity> sessions = sessionRepository.findByDisplayId(displayId);
		int revokedSessions = 0;
		for (DisplaySessionEntity session : sessions) {
			if (session.getRevokedAt() == null) {
				session.setRevokedAt(revokedAt);
				session.setRevokedByAdminId(adminId);
				sessionRepository.save(session);
				revokedSessions++;
			}
		}

		displayEntity.setStatus(DisplayStatus.REVOKED);
		displayRepository.save(displayEntity);

		auditLogService.log(adminId, "DISPLAY_SESSION_REVOKED", "display", displayId,
				Map.of("revokedSessions", revokedSessions));

		return mapDisplay(displayEntity);
	}

	@Transactional
	public DisplaySummaryResponse updateDisplay(String displayId, UpdateDisplayRequest request, String adminId) {
		DisplayEntity displayEntity = displayRepository.findById(displayId).orElseThrow(
				() -> new DisplayDomainException("DISPLAY_NOT_FOUND", HttpStatus.NOT_FOUND, "Display not found"));
		if (request == null) {
			throw new DisplayDomainException("DISPLAY_UPDATE_INVALID", HttpStatus.BAD_REQUEST,
					"Display update payload is required");
		}

		if (trimToNull(request.name()) != null) {
			displayEntity.setName(request.name().trim());
		}

		if (trimToNull(request.slug()) != null) {
			String normalizedSlug = slugService.slugify(request.slug());
			if (normalizedSlug.isBlank()) {
				throw new DisplayDomainException("DISPLAY_SLUG_INVALID", HttpStatus.BAD_REQUEST,
						"Display slug is invalid");
			}
			Optional<DisplayEntity> existingBySlug = displayRepository.findBySlug(normalizedSlug);
			if (existingBySlug.isPresent() && !Objects.equals(existingBySlug.get().getId(), displayEntity.getId())) {
				normalizedSlug = slugService.createUniqueSlug(normalizedSlug);
			}
			displayEntity.setSlug(normalizedSlug);
		}

		displayEntity.setLocationLabel(trimToNull(request.locationLabel()));
		displayEntity.setAssignedProfileId(trimToNull(request.assignedProfileId()));

		DisplayStatus requestedStatus = null;
		if (trimToNull(request.status()) != null) {
			try {
				requestedStatus = DisplayStatus.valueOf(request.status().trim().toUpperCase());
				displayEntity.setStatus(requestedStatus);
			} catch (IllegalArgumentException exception) {
				throw new DisplayDomainException("DISPLAY_STATUS_INVALID", HttpStatus.BAD_REQUEST,
						"Display status must be ACTIVE, INACTIVE, or REVOKED");
			}
		}

		displayRepository.save(displayEntity);
		int reactivatedSessions = 0;
		if (requestedStatus == DisplayStatus.ACTIVE) {
			reactivatedSessions = reactivateDisplaySessions(displayEntity.getId());
		}

		Map<String, Object> auditMetadata = new HashMap<>();
		auditMetadata.put("status", displayEntity.getStatus().name());
		auditMetadata.put("slug", displayEntity.getSlug());
		if (reactivatedSessions > 0) {
			auditMetadata.put("reactivatedSessions", reactivatedSessions);
		}

		auditLogService.log(adminId, "DISPLAY_UPDATED", "display", displayId, auditMetadata);

		return mapDisplay(displayEntity);
	}

	@Transactional(readOnly = true)
	public List<DisplaySummaryResponse> listDisplays() {
		return displayRepository.findAll().stream().sorted(Comparator.comparing(DisplayEntity::getName))
				.map(this::mapDisplay).toList();
	}

	@Transactional(readOnly = true)
	public DisplaySummaryResponse getDisplay(String displayId) {
		DisplayEntity displayEntity = displayRepository.findById(displayId).orElseThrow(
				() -> new DisplayDomainException("DISPLAY_NOT_FOUND", HttpStatus.NOT_FOUND, "Display not found"));
		return mapDisplay(displayEntity);
	}

	@Transactional(readOnly = true)
	public EnrollmentRequestStatus parseEnrollmentStatus(String status) {
		if (status == null || status.isBlank()) {
			return EnrollmentRequestStatus.PENDING;
		}
		try {
			return EnrollmentRequestStatus.valueOf(status.trim().toUpperCase());
		} catch (IllegalArgumentException exception) {
			throw new DisplayDomainException("ENROLLMENT_STATUS_INVALID", HttpStatus.BAD_REQUEST,
					"Enrollment status must be one of PENDING, APPROVED, REJECTED, EXPIRED");
		}
	}

	private DisplaySummaryResponse mapDisplay(DisplayEntity entity) {
		return new DisplaySummaryResponse(entity.getId(), entity.getName(), entity.getSlug(), entity.getLocationLabel(),
				entity.getStatus().name(), entity.getAssignedProfileId(), entity.getUpdatedAt());
	}

	private DisplayEnrollmentRequestEntity findEnrollmentRequest(String requestId) {
		if (requestId == null || requestId.isBlank()) {
			throw new DisplayDomainException("ENROLLMENT_REQUEST_NOT_FOUND", HttpStatus.NOT_FOUND,
					"Enrollment request not found");
		}
		return enrollmentRequestRepository.findById(requestId)
				.orElseThrow(() -> new DisplayDomainException("ENROLLMENT_REQUEST_NOT_FOUND", HttpStatus.NOT_FOUND,
						"Enrollment request not found"));
	}

	private void expireEnrollmentCodeIfNeeded(DisplayEnrollmentCodeEntity codeEntity, Instant now) {
		if (codeEntity.getStatus() == EnrollmentCodeStatus.ACTIVE && codeEntity.getExpiresAt().isBefore(now)) {
			codeEntity.setStatus(EnrollmentCodeStatus.EXPIRED);
			enrollmentCodeRepository.save(codeEntity);
		}
	}

	private void refreshEnrollmentRequestIfExpired(DisplayEnrollmentRequestEntity requestEntity) {
		if (requestEntity.getStatus() == EnrollmentRequestStatus.PENDING
				&& requestEntity.getExpiresAt().isBefore(Instant.now())) {
			requestEntity.setStatus(EnrollmentRequestStatus.EXPIRED);
			enrollmentRequestRepository.save(requestEntity);
		}
	}

	private int normalizePositiveInt(Integer value, int fallback) {
		if (value == null || value.intValue() <= 0) {
			return fallback;
		}
		return value.intValue();
	}

	private String serializeJson(Object value) {
		if (value == null) {
			return null;
		}
		try {
			return objectMapper.writeValueAsString(value);
		} catch (JsonProcessingException exception) {
			return "{\"error\":\"device_info_unserializable\"}";
		}
	}

	private Object parseJsonObject(String rawJson) {
		if (rawJson == null || rawJson.isBlank()) {
			return null;
		}
		try {
			return objectMapper.readValue(rawJson, Object.class);
		} catch (JsonProcessingException exception) {
			return Map.of("raw", rawJson);
		}
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		if (trimmed.isEmpty()) {
			return null;
		}
		return trimmed;
	}

	private int reactivateDisplaySessions(String displayId) {
		Instant now = Instant.now();
		int reactivatedSessions = 0;

		for (DisplaySessionEntity session : sessionRepository.findByDisplayId(displayId)) {
			if (session.getRevokedAt() != null && session.getExpiresAt().isAfter(now)) {
				session.setRevokedAt(null);
				session.setRevokedByAdminId(null);
				sessionRepository.save(session);
				reactivatedSessions++;
			}
		}
		return reactivatedSessions;
	}

	private DisplaySessionValidationResponse invalidSessionResponse() {
		return new DisplaySessionValidationResponse(false, null, null, null, null);
	}
}
