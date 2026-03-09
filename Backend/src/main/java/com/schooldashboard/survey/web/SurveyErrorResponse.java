package com.schooldashboard.survey.web;

import java.time.Instant;

public record SurveyErrorResponse(String code, String message, String requestId, Instant timestamp) {
}
