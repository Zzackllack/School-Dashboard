package com.schooldashboard.warning.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@ConfigurationProperties(prefix = "warnings")
@Validated
public class WarningProperties {

	private boolean enabled;
	private String regionCode = "";
	private String apiBaseUrl = "https://warnung.bund.de/api31";

	@Min(1)
	private long pollIntervalMs = 10_000;

	@Min(0)
	private long initialDelayMs = 5_000;

	@Min(1)
	private int maxWarnings = 25;

	@Min(1_024)
	private int maxResponseChars = 1_000_000;

	public boolean isEnabled() {
		return enabled;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public String getRegionCode() {
		return regionCode;
	}

	public void setRegionCode(String regionCode) {
		this.regionCode = regionCode;
	}

	public String getApiBaseUrl() {
		return apiBaseUrl;
	}

	public void setApiBaseUrl(String apiBaseUrl) {
		this.apiBaseUrl = apiBaseUrl;
	}

	public long getPollIntervalMs() {
		return pollIntervalMs;
	}

	public void setPollIntervalMs(long pollIntervalMs) {
		this.pollIntervalMs = pollIntervalMs;
	}

	public long getInitialDelayMs() {
		return initialDelayMs;
	}

	public void setInitialDelayMs(long initialDelayMs) {
		this.initialDelayMs = initialDelayMs;
	}

	public int getMaxWarnings() {
		return maxWarnings;
	}

	public void setMaxWarnings(int maxWarnings) {
		this.maxWarnings = maxWarnings;
	}

	public int getMaxResponseChars() {
		return maxResponseChars;
	}

	public void setMaxResponseChars(int maxResponseChars) {
		this.maxResponseChars = maxResponseChars;
	}

	public boolean isConfigured() {
		return enabled && regionCode != null && !regionCode.trim().isEmpty();
	}
}
