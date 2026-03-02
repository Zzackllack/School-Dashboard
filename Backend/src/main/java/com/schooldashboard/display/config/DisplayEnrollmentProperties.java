package com.schooldashboard.display.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "display.enrollment")
public class DisplayEnrollmentProperties {

	private int codeLength = 8;
	private int codeTtlSeconds = 900;
	private int requestTtlSeconds = 86400;
	private int sessionTtlSeconds = 2592000;
	private int pollAfterSeconds = 5;
	private int defaultCodeMaxUses = 5;

	public int getCodeLength() {
		return codeLength;
	}

	public void setCodeLength(int codeLength) {
		this.codeLength = codeLength;
	}

	public int getCodeTtlSeconds() {
		return codeTtlSeconds;
	}

	public void setCodeTtlSeconds(int codeTtlSeconds) {
		this.codeTtlSeconds = codeTtlSeconds;
	}

	public int getRequestTtlSeconds() {
		return requestTtlSeconds;
	}

	public void setRequestTtlSeconds(int requestTtlSeconds) {
		this.requestTtlSeconds = requestTtlSeconds;
	}

	public int getSessionTtlSeconds() {
		return sessionTtlSeconds;
	}

	public void setSessionTtlSeconds(int sessionTtlSeconds) {
		this.sessionTtlSeconds = sessionTtlSeconds;
	}

	public int getPollAfterSeconds() {
		return pollAfterSeconds;
	}

	public void setPollAfterSeconds(int pollAfterSeconds) {
		this.pollAfterSeconds = pollAfterSeconds;
	}

	public int getDefaultCodeMaxUses() {
		return defaultCodeMaxUses;
	}

	public void setDefaultCodeMaxUses(int defaultCodeMaxUses) {
		this.defaultCodeMaxUses = defaultCodeMaxUses;
	}
}
