package com.schooldashboard.display.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "display.admin-auth")
public class DisplayAdminAuthProperties {

	private String apiToken = "dev-admin-token";

	public String getApiToken() {
		return apiToken;
	}

	public void setApiToken(String apiToken) {
		this.apiToken = apiToken;
	}
}
