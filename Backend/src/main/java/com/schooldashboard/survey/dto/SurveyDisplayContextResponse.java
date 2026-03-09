package com.schooldashboard.survey.dto;

public record SurveyDisplayContextResponse(String displayId, String displayName, String locationLabel, String themeId,
		boolean acceptingFeedback) {
}
