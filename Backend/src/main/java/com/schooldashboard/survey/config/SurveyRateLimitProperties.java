package com.schooldashboard.survey.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "survey.rate-limit")
public class SurveyRateLimitProperties {

	private int submissionsPerMinute = 5;

	public int getSubmissionsPerMinute() {
		return submissionsPerMinute;
	}

	public void setSubmissionsPerMinute(int submissionsPerMinute) {
		if (submissionsPerMinute <= 0) {
			throw new IllegalArgumentException("survey.rate-limit.submissions-per-minute must be greater than 0");
		}
		this.submissionsPerMinute = submissionsPerMinute;
	}
}
