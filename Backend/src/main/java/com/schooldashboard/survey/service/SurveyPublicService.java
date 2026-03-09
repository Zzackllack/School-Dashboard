package com.schooldashboard.survey.service;

import com.schooldashboard.display.entity.DisplayEntity;
import com.schooldashboard.display.entity.DisplayStatus;
import com.schooldashboard.display.repository.DisplayRepository;
import com.schooldashboard.display.service.TokenHashService;
import com.schooldashboard.survey.dto.CreateSurveySubmissionRequest;
import com.schooldashboard.survey.dto.CreateSurveySubmissionResponse;
import com.schooldashboard.survey.dto.SurveyDisplayContextResponse;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import com.schooldashboard.survey.web.SurveyDomainException;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SurveyPublicService {

	private final DisplayRepository displayRepository;
	private final SurveySubmissionRepository surveySubmissionRepository;
	private final TokenHashService tokenHashService;

	public SurveyPublicService(DisplayRepository displayRepository,
			SurveySubmissionRepository surveySubmissionRepository, TokenHashService tokenHashService) {
		this.displayRepository = displayRepository;
		this.surveySubmissionRepository = surveySubmissionRepository;
		this.tokenHashService = tokenHashService;
	}

	@Transactional(readOnly = true)
	public SurveyDisplayContextResponse getDisplayContext(String displayId) {
		DisplayEntity display = displayRepository.findById(displayId).orElseThrow(
				() -> new SurveyDomainException("SURVEY_DISPLAY_NOT_FOUND", HttpStatus.NOT_FOUND, "Display not found"));
		return mapDisplayContext(display);
	}

	@Transactional
	public CreateSurveySubmissionResponse createSubmission(CreateSurveySubmissionRequest request, String sourceIp) {
		DisplayEntity display = displayRepository.findById(request.displayId()).orElseThrow(
				() -> new SurveyDomainException("SURVEY_DISPLAY_NOT_FOUND", HttpStatus.NOT_FOUND, "Display not found"));
		if (!isAcceptingFeedback(display)) {
			throw new SurveyDomainException("SURVEY_DISPLAY_NOT_ACCEPTING", HttpStatus.BAD_REQUEST,
					"Display is not accepting feedback");
		}

		String submitterName = normalizeOptional(request.name());
		String schoolClass = normalizeOptional(request.schoolClass());
		boolean contactAllowed = Boolean.TRUE.equals(request.contactAllowed());
		SurveySubmissionEntity entity = new SurveySubmissionEntity(display, request.category(),
				request.message().trim(), submitterName, schoolClass, contactAllowed,
				tokenHashService.hash(normalizeSourceIp(sourceIp)));
		SurveySubmissionEntity saved = surveySubmissionRepository.save(entity);
		return new CreateSurveySubmissionResponse(saved.getId(), saved.getCreatedAt(), "RECORDED");
	}

	private SurveyDisplayContextResponse mapDisplayContext(DisplayEntity display) {
		return new SurveyDisplayContextResponse(display.getId(), display.getName(), display.getLocationLabel(),
				display.getThemeId(), isAcceptingFeedback(display));
	}

	private boolean isAcceptingFeedback(DisplayEntity display) {
		return display.getStatus() == DisplayStatus.ACTIVE;
	}

	private String normalizeSourceIp(String sourceIp) {
		String normalized = Optional.ofNullable(sourceIp).map(String::trim).orElse("");
		if (normalized.isBlank()) {
			return "unknown";
		}
		return normalized;
	}

	private String normalizeOptional(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
