package com.schooldashboard.display.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "display.rate-limit")
public class DisplayRateLimitProperties {

	private int enrollmentsPerMinute = 20;
	private int sessionValidationsPerMinute = 120;

	public int getEnrollmentsPerMinute() {
		return enrollmentsPerMinute;
	}

	public void setEnrollmentsPerMinute(int enrollmentsPerMinute) {
		if (enrollmentsPerMinute <= 0) {
			throw new IllegalArgumentException("display.rate-limit.enrollments-per-minute must be greater than 0");
		}
		this.enrollmentsPerMinute = enrollmentsPerMinute;
	}

	public int getSessionValidationsPerMinute() {
		return sessionValidationsPerMinute;
	}

	public void setSessionValidationsPerMinute(int sessionValidationsPerMinute) {
		if (sessionValidationsPerMinute <= 0) {
			throw new IllegalArgumentException(
					"display.rate-limit.session-validations-per-minute must be greater than 0");
		}
		this.sessionValidationsPerMinute = sessionValidationsPerMinute;
	}
}
