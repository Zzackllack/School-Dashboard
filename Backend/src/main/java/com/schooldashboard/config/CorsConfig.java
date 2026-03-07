package com.schooldashboard.config;

import com.schooldashboard.security.config.SecurityProperties;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

	@Bean
	public CorsConfigurationSource corsConfigurationSource(SecurityProperties securityProperties) {
		SecurityProperties.Cors corsProperties = securityProperties.getCors();

		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowCredentials(corsProperties.isAllowCredentials());
		configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
		configuration.setAllowedMethods(corsProperties.getAllowedMethods());
		configuration.setAllowedHeaders(corsProperties.getAllowedHeaders());
		configuration.setExposedHeaders(corsProperties.getExposedHeaders());
		configuration.setMaxAge(3600L);

		if (configuration.getAllowedOrigins() == null || configuration.getAllowedOrigins().isEmpty()) {
			configuration.setAllowedOrigins(List.of());
		}

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
