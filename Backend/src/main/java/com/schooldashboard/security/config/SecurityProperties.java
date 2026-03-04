package com.schooldashboard.security.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security")
public class SecurityProperties {

	private final Admin admin = new Admin();
	private final Session session = new Session();
	private final Cors cors = new Cors();

	public Admin getAdmin() {
		return admin;
	}

	public Session getSession() {
		return session;
	}

	public Cors getCors() {
		return cors;
	}

	public static class Admin {

		private final Bootstrap bootstrap = new Bootstrap();

		public Bootstrap getBootstrap() {
			return bootstrap;
		}
	}

	public static class Bootstrap {

		private boolean enabled;
		private String username;
		private String password;

		public boolean isEnabled() {
			return enabled;
		}

		public void setEnabled(boolean enabled) {
			this.enabled = enabled;
		}

		public String getUsername() {
			return username;
		}

		public void setUsername(String username) {
			this.username = username;
		}

		public String getPassword() {
			return password;
		}

		public void setPassword(String password) {
			this.password = password;
		}
	}

	public static class Session {

		private Duration idleTimeout = Duration.ofMinutes(30);

		public Duration getIdleTimeout() {
			return idleTimeout;
		}

		public void setIdleTimeout(Duration idleTimeout) {
			this.idleTimeout = idleTimeout;
		}
	}

	public static class Cors {

		private List<String> allowedOrigins = new ArrayList<>();
		private List<String> allowedMethods = new ArrayList<>(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS"));
		private List<String> allowedHeaders = new ArrayList<>(
				List.of("Authorization", "Content-Type", "X-Requested-With", "X-CSRF-TOKEN", "X-Request-Id"));
		private List<String> exposedHeaders = new ArrayList<>(List.of("X-Request-Id"));
		private boolean allowCredentials = true;

		public List<String> getAllowedOrigins() {
			return allowedOrigins;
		}

		public void setAllowedOrigins(List<String> allowedOrigins) {
			this.allowedOrigins = allowedOrigins;
		}

		public List<String> getAllowedMethods() {
			return allowedMethods;
		}

		public void setAllowedMethods(List<String> allowedMethods) {
			this.allowedMethods = allowedMethods;
		}

		public List<String> getAllowedHeaders() {
			return allowedHeaders;
		}

		public void setAllowedHeaders(List<String> allowedHeaders) {
			this.allowedHeaders = allowedHeaders;
		}

		public List<String> getExposedHeaders() {
			return exposedHeaders;
		}

		public void setExposedHeaders(List<String> exposedHeaders) {
			this.exposedHeaders = exposedHeaders;
		}

		public boolean isAllowCredentials() {
			return allowCredentials;
		}

		public void setAllowCredentials(boolean allowCredentials) {
			this.allowCredentials = allowCredentials;
		}
	}
}
