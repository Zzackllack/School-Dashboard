package com.schooldashboard.survey.dto;

import com.schooldashboard.survey.entity.SurveyCategory;
import java.time.Instant;

public record AdminSurveyListItemResponse(String id, String displayId, String displayName, String locationLabel,
		SurveyCategory category, String message, String submitterName, String schoolClass, boolean contactAllowed,
		Instant createdAt) {
}
