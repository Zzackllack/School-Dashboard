package com.schooldashboard.survey.service;

import com.schooldashboard.survey.dto.AdminSurveyListItemResponse;
import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SurveyAdminService {

	private static final int DEFAULT_LIMIT = 50;
	private static final int MAX_LIMIT = 100;

	private final SurveySubmissionRepository surveySubmissionRepository;

	public SurveyAdminService(SurveySubmissionRepository surveySubmissionRepository) {
		this.surveySubmissionRepository = surveySubmissionRepository;
	}

	@Transactional(readOnly = true)
	@PreAuthorize("hasRole('ADMIN')")
	public List<AdminSurveyListItemResponse> getInbox(SurveyCategory category, String displayId, String query,
			Integer limit) {
		Pageable pageable = PageRequest.of(0, sanitizeLimit(limit));
		return surveySubmissionRepository.findInboxItems(category, normalize(displayId), normalize(query), pageable)
				.stream().map(this::toResponse).toList();
	}

	private AdminSurveyListItemResponse toResponse(SurveySubmissionEntity entity) {
		return new AdminSurveyListItemResponse(entity.getId(), entity.getDisplay().getId(), entity.getDisplay().getName(),
				entity.getDisplay().getLocationLabel(), entity.getCategory(), entity.getMessage(),
				entity.getSubmitterName(), entity.getSchoolClass(), entity.isContactAllowed(), entity.getCreatedAt());
	}

	private int sanitizeLimit(Integer limit) {
		if (limit == null) {
			return DEFAULT_LIMIT;
		}
		return Math.max(1, Math.min(limit, MAX_LIMIT));
	}

	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
