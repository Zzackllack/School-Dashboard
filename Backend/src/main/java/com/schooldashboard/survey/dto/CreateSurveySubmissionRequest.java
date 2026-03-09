package com.schooldashboard.survey.dto;

import com.schooldashboard.survey.entity.SurveyCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateSurveySubmissionRequest(
		@NotBlank(message = "displayId ist erforderlich") String displayId,
		@NotNull(message = "Kategorie ist erforderlich") SurveyCategory category,
		@NotBlank(message = "Nachricht ist erforderlich") @Size(min = 10, max = 2000,
				message = "Nachricht muss zwischen 10 und 2000 Zeichen lang sein") String message,
		@Size(max = 160, message = "Name darf maximal 160 Zeichen lang sein") String name,
		@Size(max = 40, message = "Klasse darf maximal 40 Zeichen lang sein") String schoolClass,
		Boolean contactAllowed) {
}
