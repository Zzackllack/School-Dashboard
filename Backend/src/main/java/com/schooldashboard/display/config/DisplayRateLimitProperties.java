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
		this.enrollmentsPerMinute = enrollmentsPerMinute;
	}

	public int getSessionValidationsPerMinute() {
		return sessionValidationsPerMinute;
	}

	public void setSessionValidationsPerMinute(int sessionValidationsPerMinute) {
		this.sessionValidationsPerMinute = sessionValidationsPerMinute;
	}
}
