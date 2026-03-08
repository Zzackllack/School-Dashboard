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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DisplayEnrollmentService {

	private static final Logger logger = LoggerFactory.getLogger(DisplayEnrollmentService.class);
	private static final String DEFAULT_THEME_ID = "default";
	private static final List<String> ALLOWED_THEME_IDS = List.of(DEFAULT_THEME_ID, "brutalist-high-density");

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
	@PreAuthorize("hasRole('ADMIN')")
	public CreateEnrollmentCodeResponse createEnrollmentCode(String adminId, CreateEnrollmentCodeRequest request) {
		int ttlSeconds = request.ttlSeconds();
		int maxUses = request.maxUses();
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
				.findLockedByCodeHash(tokenHashService.hash(enrollmentCode))
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
			String issuedSessionToken = issueSessionTokenForApprovedRequest(requestEntity);
			return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(),
					requestEntity.getDisplayId(), issuedSessionToken, null);
		}

		return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(), null, null, null);
	}

	@Transactional(readOnly = true)
	@PreAuthorize("hasRole('ADMIN')")
	public List<PendingEnrollmentResponse> listEnrollments(EnrollmentRequestStatus status) {
		return enrollmentRequestRepository.findByStatusOrderByCreatedAtAsc(status).stream()
				.map(request -> new PendingEnrollmentResponse(request.getId(), request.getEnrollmentCodeId(),
						request.getProposedDisplayName(), parseJsonObject(request.getDeviceInfoJson()),
						request.getStatus().name(), request.getDisplayId(), request.getCreatedAt(),
						request.getExpiresAt()))
				.toList();
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
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
		display = saveDisplayWithSlugRetry(display, resolvedDisplayName, requestedSlug);

		Instant now = Instant.now();
		requestEntity.setStatus(EnrollmentRequestStatus.APPROVED);
		requestEntity.setDisplayId(display.getId());
		requestEntity.setIssuedSessionTokenHash(null);
		requestEntity.setOneTimeHandoffTokenHash(null);
		requestEntity.setApprovedByAdminId(adminId);
		requestEntity.setApprovedAt(now);
		enrollmentRequestRepository.save(requestEntity);

		auditLogService.log(adminId, "ENROLLMENT_REQUEST_APPROVED", "display_enrollment_request", requestEntity.getId(),
				Map.of("displayId", display.getId(), "displaySlug", display.getSlug()));

		logger.info("Display enrollment approved. requestId={}, displayId={}", requestEntity.getId(), display.getId());

		return new EnrollmentStatusResponse(requestEntity.getId(), requestEntity.getStatus().name(), display.getId(),
				null, null);
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
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
				displayEntity.getAssignedProfileId(), displayEntity.getThemeId(), "/display/" + displayEntity.getId());
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
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
	@PreAuthorize("hasRole('ADMIN')")
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

		if (request.locationLabel() != null) {
			displayEntity.setLocationLabel(trimToNull(request.locationLabel()));
		}
		if (request.assignedProfileId() != null) {
			displayEntity.setAssignedProfileId(trimToNull(request.assignedProfileId()));
		}
		if (request.themeId() != null) {
			displayEntity.setThemeId(validateThemeId(request.themeId()));
		}

		DisplayStatus requestedStatus = request.status();
		if (requestedStatus != null) {
			displayEntity.setStatus(requestedStatus);
		}

		displayRepository.save(displayEntity);

		Map<String, Object> auditMetadata = new HashMap<>();
		auditMetadata.put("status", displayEntity.getStatus().name());
		auditMetadata.put("slug", displayEntity.getSlug());
		auditMetadata.put("themeId", displayEntity.getThemeId());

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

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public void deleteDisplay(String displayId, String adminId) {
		DisplayEntity displayEntity = displayRepository.findById(displayId).orElseThrow(
				() -> new DisplayDomainException("DISPLAY_NOT_FOUND", HttpStatus.NOT_FOUND, "Display not found"));

		List<DisplayEnrollmentRequestEntity> linkedRequests = enrollmentRequestRepository.findByDisplayId(displayId);
		for (DisplayEnrollmentRequestEntity linkedRequest : linkedRequests) {
			linkedRequest.setDisplayId(null);
			enrollmentRequestRepository.save(linkedRequest);
		}

		sessionRepository.deleteByDisplayId(displayId);
		displayRepository.delete(displayEntity);

		auditLogService.log(adminId, "DISPLAY_DELETED", "display", displayId,
				Map.of("enrollmentRequestsUpdated", linkedRequests.size()));
	}

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
				entity.getStatus().name(), entity.getAssignedProfileId(), entity.getThemeId(), entity.getUpdatedAt());
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

	private DisplaySessionValidationResponse invalidSessionResponse() {
		return new DisplaySessionValidationResponse(false, null, null, null, null, null);
	}

	private String validateThemeId(String themeId) {
		String normalizedThemeId = trimToNull(themeId);
		if (normalizedThemeId == null) {
			throw new DisplayDomainException("DISPLAY_THEME_INVALID", HttpStatus.BAD_REQUEST,
					"Display theme id must not be blank");
		}
		if (!ALLOWED_THEME_IDS.contains(normalizedThemeId)) {
			throw new DisplayDomainException("DISPLAY_THEME_INVALID", HttpStatus.BAD_REQUEST,
					"Display theme id is not supported");
		}
		return normalizedThemeId;
	}

	private String issueSessionTokenForApprovedRequest(DisplayEnrollmentRequestEntity requestEntity) {
		if (requestEntity.getDisplayId() == null) {
			return null;
		}
		if (requestEntity.getOneTimeHandoffTokenHash() != null) {
			return null;
		}

		String sessionToken = randomTokenService.nextSessionToken(64);
		String tokenHash = tokenHashService.hash(sessionToken);
		Instant now = Instant.now();
		DisplaySessionEntity sessionEntity = new DisplaySessionEntity(requestEntity.getDisplayId(), tokenHash, now,
				now.plusSeconds(enrollmentProperties.getSessionTtlSeconds()));
		sessionRepository.save(sessionEntity);
		requestEntity.setIssuedSessionTokenHash(null);
		requestEntity.setOneTimeHandoffTokenHash(tokenHash);
		enrollmentRequestRepository.save(requestEntity);
		return sessionToken;
	}

	private DisplayEntity saveDisplayWithSlugRetry(DisplayEntity display, String resolvedDisplayName,
			String requestedSlug) {
		String baseSlugInput = requestedSlug == null ? resolvedDisplayName : requestedSlug;
		String candidateSlug = display.getSlug();
		for (int attempt = 1; attempt <= 3; attempt++) {
			try {
				display.setSlug(candidateSlug);
				return displayRepository.save(display);
			} catch (DataIntegrityViolationException ex) {
				if (attempt == 3) {
					throw ex;
				}
				candidateSlug = slugService.createUniqueSlug(baseSlugInput);
			}
		}
		throw new IllegalStateException("Display slug retry exhausted without result");
	}

}
