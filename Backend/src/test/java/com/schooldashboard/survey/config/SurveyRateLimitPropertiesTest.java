package com.schooldashboard.survey.config;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

public class SurveyRateLimitPropertiesTest {

	@Test
	public void rejectsNonPositiveSubmissionRate() {
		SurveyRateLimitProperties properties = new SurveyRateLimitProperties();
		assertThrows(IllegalArgumentException.class, () -> properties.setSubmissionsPerMinute(0));
	}
}
