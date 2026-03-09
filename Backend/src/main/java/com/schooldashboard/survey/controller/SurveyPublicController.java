package com.schooldashboard.survey.controller;

import com.schooldashboard.display.service.RequestRateLimiter;
import com.schooldashboard.survey.config.SurveyRateLimitProperties;
import com.schooldashboard.survey.dto.CreateSurveySubmissionRequest;
import com.schooldashboard.survey.dto.CreateSurveySubmissionResponse;
import com.schooldashboard.survey.dto.SurveyDisplayContextResponse;
import com.schooldashboard.survey.service.SurveyPublicService;
import com.schooldashboard.survey.web.SurveyDomainException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/surveys")
public class SurveyPublicController {

	private final SurveyPublicService surveyPublicService;
	private final RequestRateLimiter requestRateLimiter;
	private final SurveyRateLimitProperties surveyRateLimitProperties;

	public SurveyPublicController(SurveyPublicService surveyPublicService, RequestRateLimiter requestRateLimiter,
			SurveyRateLimitProperties surveyRateLimitProperties) {
		this.surveyPublicService = surveyPublicService;
		this.requestRateLimiter = requestRateLimiter;
		this.surveyRateLimitProperties = surveyRateLimitProperties;
	}

	@GetMapping("/displays/{displayId:[0-9a-fA-F\\-]{36}}")
	public SurveyDisplayContextResponse getDisplayContext(@PathVariable String displayId) {
		return surveyPublicService.getDisplayContext(displayId);
	}

	@PostMapping("/submissions")
	public ResponseEntity<CreateSurveySubmissionResponse> createSubmission(
			@Valid @RequestBody CreateSurveySubmissionRequest request, HttpServletRequest httpRequest) {
		enforceRateLimit(resolveClientKey(httpRequest));
		CreateSurveySubmissionResponse response = surveyPublicService.createSubmission(request,
				resolveClientKey(httpRequest));
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	private void enforceRateLimit(String key) {
		boolean allowed = requestRateLimiter.tryAcquire("survey-submission", key,
				surveyRateLimitProperties.getSubmissionsPerMinute(), Duration.ofMinutes(1));
		if (!allowed) {
			throw new SurveyDomainException("SURVEY_RATE_LIMIT_EXCEEDED", HttpStatus.TOO_MANY_REQUESTS,
					"Too many survey submissions. Please retry shortly.");
		}
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
}
