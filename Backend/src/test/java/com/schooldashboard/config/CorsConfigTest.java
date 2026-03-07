package com.schooldashboard.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.schooldashboard.security.config.SecurityProperties;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

public class CorsConfigTest {

	@Test
	public void corsConfigurationSourceUsesSecurityProperties() {
		SecurityProperties securityProperties = new SecurityProperties();
		securityProperties.getCors().setAllowedOrigins(List.of("http://localhost:5173"));
		securityProperties.getCors().setAllowedMethods(List.of("GET", "POST"));

		CorsConfig config = new CorsConfig();
		CorsConfigurationSource source = config.corsConfigurationSource(securityProperties);
		CorsConfiguration cors = ((UrlBasedCorsConfigurationSource) source)
				.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/test"));

		assertEquals(List.of("http://localhost:5173"), cors.getAllowedOrigins());
		assertTrue(cors.getAllowedMethods().containsAll(List.of("GET", "POST")));
	}
}
