package com.schooldashboard.config;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Method;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

public class CorsConfigTest {

	@Test
	public void corsConfigurerAddsGlobalMapping() throws Exception {
		CorsConfig config = new CorsConfig();
		WebMvcConfigurer configurer = config.corsConfigurer();
		CorsRegistry registry = new CorsRegistry();
		configurer.addCorsMappings(registry);

		// use reflection to access protected method getCorsConfigurations
		Method method = CorsRegistry.class.getDeclaredMethod("getCorsConfigurations");
		method.setAccessible(true);
		@SuppressWarnings("unchecked")
		Map<String, CorsConfiguration> configs = (Map<String, CorsConfiguration>) method.invoke(registry);

		assertTrue(configs.containsKey("/**"));
		CorsConfiguration cors = configs.get("/**");
		assertEquals("*", cors.getAllowedOrigins().get(0));
		assertTrue(cors.getAllowedMethods()
				.containsAll(java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")));
	}
}
