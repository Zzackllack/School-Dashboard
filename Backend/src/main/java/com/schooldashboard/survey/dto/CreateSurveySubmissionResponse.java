package com.schooldashboard.survey.dto;

import java.time.Instant;

public record CreateSurveySubmissionResponse(String submissionId, Instant createdAt, String status) {
}
