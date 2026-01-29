package com.schooldashboard.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "calendar")
public class CalendarProperties {

	private String icsUrl;

	public String getIcsUrl() {
		return icsUrl;
	}

	public void setIcsUrl(String icsUrl) {
		this.icsUrl = icsUrl;
	}
}
