package com.schooldashboard.display.controller;

import com.schooldashboard.display.config.DisplayRateLimitProperties;
import com.schooldashboard.display.dto.CreateEnrollmentRequest;
import com.schooldashboard.display.dto.CreateEnrollmentResponse;
import com.schooldashboard.display.dto.DisplaySessionValidationResponse;
import com.schooldashboard.display.dto.EnrollmentStatusResponse;
import com.schooldashboard.display.service.DisplayEnrollmentService;
import com.schooldashboard.display.service.RequestRateLimiter;
import com.schooldashboard.display.web.DisplayDomainException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/displays")
public class DisplayPublicController {

	private final DisplayEnrollmentService enrollmentService;
	private final RequestRateLimiter rateLimiter;
	private final DisplayRateLimitProperties rateLimitProperties;

	public DisplayPublicController(DisplayEnrollmentService enrollmentService, RequestRateLimiter rateLimiter,
			DisplayRateLimitProperties rateLimitProperties) {
		this.enrollmentService = enrollmentService;
		this.rateLimiter = rateLimiter;
		this.rateLimitProperties = rateLimitProperties;
	}

	@PostMapping("/enrollments")
	public ResponseEntity<CreateEnrollmentResponse> createEnrollment(@RequestBody CreateEnrollmentRequest request,
			HttpServletRequest httpRequest) {
		enforceRateLimit("display-enrollment", resolveClientKey(httpRequest),
				rateLimitProperties.getEnrollmentsPerMinute());
		CreateEnrollmentResponse response = enrollmentService.createEnrollmentRequest(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping("/enrollments/{requestId}")
	public EnrollmentStatusResponse getEnrollmentStatus(@PathVariable String requestId) {
		return enrollmentService.getEnrollmentStatus(requestId);
	}

	@GetMapping("/session")
	public DisplaySessionValidationResponse validateSession(
			@RequestHeader(name = "Authorization", required = false) String authorization, HttpServletRequest request) {
		enforceRateLimit("display-session-validation", resolveClientKey(request),
				rateLimitProperties.getSessionValidationsPerMinute());
		return enrollmentService.validateSession(extractBearerToken(authorization));
	}

	private String resolveClientKey(HttpServletRequest request) {
		String forwardedFor = request.getHeader("X-Forwarded-For");
		if (forwardedFor != null && !forwardedFor.isBlank()) {
			int separatorIndex = forwardedFor.indexOf(',');
			return separatorIndex > 0 ? forwardedFor.substring(0, separatorIndex).trim() : forwardedFor.trim();
		}
		if (request.getRemoteAddr() == null || request.getRemoteAddr().isBlank()) {
			return "unknown";
		}
		return request.getRemoteAddr();
	}

	private String extractBearerToken(String authorizationHeader) {
		if (authorizationHeader == null || authorizationHeader.isBlank()) {
			return null;
		}
		if (authorizationHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
			return authorizationHeader.substring(7).trim();
		}
		return authorizationHeader.trim();
	}

	private void enforceRateLimit(String bucketName, String key, int maxPerMinute) {
		boolean allowed = rateLimiter.tryAcquire(bucketName, key, Math.max(1, maxPerMinute), Duration.ofMinutes(1));
		if (!allowed) {
			throw new DisplayDomainException("RATE_LIMIT_EXCEEDED", HttpStatus.TOO_MANY_REQUESTS,
					"Too many requests. Please retry shortly.");
		}
	}
}
