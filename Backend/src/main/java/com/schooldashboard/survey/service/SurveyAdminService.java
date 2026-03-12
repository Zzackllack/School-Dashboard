package com.schooldashboard.survey.service;

import com.schooldashboard.survey.dto.AdminSurveyListItemResponse;
import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import java.util.List;
import java.util.Locale;
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
		String normalizedDisplayId = normalize(displayId);
		String normalizedQuery = normalize(query);
		int sanitizedLimit = sanitizeLimit(limit);
		Pageable pageable = normalizedQuery == null ? PageRequest.of(0, sanitizedLimit) : Pageable.unpaged();

		return surveySubmissionRepository.findInboxItems(category, normalizedDisplayId, pageable).stream()
				.filter(entity -> matchesQuery(entity, normalizedQuery)).limit(sanitizedLimit).map(this::toResponse)
				.toList();
	}

	private AdminSurveyListItemResponse toResponse(SurveySubmissionEntity entity) {
		return new AdminSurveyListItemResponse(entity.getId(), entity.getDisplay().getId(),
				entity.getDisplay().getName(), entity.getDisplay().getLocationLabel(), entity.getCategory(),
				entity.getMessage(), entity.getSubmitterName(), entity.getSchoolClass(), entity.isContactAllowed(),
				entity.getCreatedAt());
	}

	private int sanitizeLimit(Integer limit) {
		if (limit == null) {
			return DEFAULT_LIMIT;
		}
		return Math.max(1, Math.min(limit, MAX_LIMIT));
	}

	private boolean matchesQuery(SurveySubmissionEntity entity, String query) {
		if (query == null) {
			return true;
		}

		String normalizedQuery = query.toLowerCase(Locale.ROOT);
		return containsIgnoreCase(entity.getMessage(), normalizedQuery)
				|| containsIgnoreCase(entity.getSubmitterName(), normalizedQuery)
				|| containsIgnoreCase(entity.getDisplay().getName(), normalizedQuery)
				|| containsIgnoreCase(entity.getDisplay().getLocationLabel(), normalizedQuery);
	}

	private boolean containsIgnoreCase(String value, String query) {
		return value != null && value.toLowerCase(Locale.ROOT).contains(query);
	}

	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		return trimmed.isEmpty() ? null : trimmed;
	}
}
