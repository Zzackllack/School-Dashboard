package com.schooldashboard.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
		// Make sure static resources are served correctly
		registry.addResourceHandler("/css/**").addResourceLocations("classpath:/static/css/");
	}
}
