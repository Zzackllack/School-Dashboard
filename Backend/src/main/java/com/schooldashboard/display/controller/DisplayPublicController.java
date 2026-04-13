package com.schooldashboard.display.controller;

import com.schooldashboard.display.config.DisplayRateLimitProperties;
import com.schooldashboard.display.config.DisplayEnrollmentProperties;
import com.schooldashboard.display.dto.CreateEnrollmentRequest;
import com.schooldashboard.display.dto.CreateEnrollmentResponse;
import com.schooldashboard.display.dto.DisplaySessionValidationResponse;
import com.schooldashboard.display.dto.EnrollmentStatusResponse;
import com.schooldashboard.display.service.DisplayEnrollmentService;
import com.schooldashboard.display.service.RequestRateLimiter;
import com.schooldashboard.display.web.DisplayDomainException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ResponseCookie;
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

	private static final String DISPLAY_SESSION_COOKIE_NAME = "DISPLAY_SESSION_TOKEN";

	private final DisplayEnrollmentService enrollmentService;
	private final RequestRateLimiter rateLimiter;
	private final DisplayRateLimitProperties rateLimitProperties;
	private final DisplayEnrollmentProperties enrollmentProperties;

	public DisplayPublicController(DisplayEnrollmentService enrollmentService, RequestRateLimiter rateLimiter,
			DisplayRateLimitProperties rateLimitProperties, DisplayEnrollmentProperties enrollmentProperties) {
		this.enrollmentService = enrollmentService;
		this.rateLimiter = rateLimiter;
		this.rateLimitProperties = rateLimitProperties;
		this.enrollmentProperties = enrollmentProperties;
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
	public ResponseEntity<EnrollmentStatusResponse> getEnrollmentStatus(@PathVariable String requestId,
			HttpServletRequest request) {
		EnrollmentStatusResponse response = enrollmentService.getEnrollmentStatus(requestId);
		if ("APPROVED".equals(response.status()) && response.displaySessionToken() != null) {
			ResponseCookie cookie = buildDisplaySessionCookie(response.displaySessionToken(), request.isSecure());
			return ResponseEntity.ok().header("Set-Cookie", cookie.toString()).body(new EnrollmentStatusResponse(
					response.requestId(), response.status(), response.displayId(), null, response.pollAfterSeconds()));
		}
		return ResponseEntity.ok(response);
	}

	@GetMapping("/session")
	public ResponseEntity<DisplaySessionValidationResponse> validateSession(
			@RequestHeader(name = "Authorization", required = false) String authorization, HttpServletRequest request) {
		enforceRateLimit("display-session-validation", resolveClientKey(request),
				rateLimitProperties.getSessionValidationsPerMinute());
		String sessionToken = resolveSessionToken(authorization, request);
		DisplaySessionValidationResponse response = enrollmentService.validateSession(sessionToken);
		ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok().cacheControl(CacheControl.noStore());
		if (response.valid() && sessionToken != null && !sessionToken.isBlank()) {
			responseBuilder.header("Set-Cookie",
					buildDisplaySessionCookie(sessionToken, request.isSecure()).toString());
		}
		return responseBuilder.body(response);
	}

	private ResponseCookie buildDisplaySessionCookie(String sessionToken, boolean secureRequest) {
		return ResponseCookie.from(DISPLAY_SESSION_COOKIE_NAME, sessionToken).httpOnly(true).secure(secureRequest)
				.sameSite("Lax").path("/").maxAge(Duration.ofSeconds(enrollmentProperties.getSessionTtlSeconds()))
				.build();
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

	private String resolveSessionToken(String authorizationHeader, HttpServletRequest request) {
		String bearerToken = extractBearerToken(authorizationHeader);
		if (bearerToken != null && !bearerToken.isBlank()) {
			return bearerToken;
		}
		Cookie[] cookies = request.getCookies();
		if (cookies == null) {
			return null;
		}
		for (Cookie cookie : cookies) {
			if (DISPLAY_SESSION_COOKIE_NAME.equals(cookie.getName())) {
				return cookie.getValue();
			}
		}
		return null;
	}

	private void enforceRateLimit(String bucketName, String key, int maxPerMinute) {
		boolean allowed = rateLimiter.tryAcquire(bucketName, key, Math.max(1, maxPerMinute), Duration.ofMinutes(1));
		if (!allowed) {
			throw new DisplayDomainException("RATE_LIMIT_EXCEEDED", HttpStatus.TOO_MANY_REQUESTS,
					"Too many requests. Please retry shortly.");
		}
	}
}
