package com.schooldashboard.security.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.security.metrics.SecurityMetricsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private static final Logger logger = LoggerFactory.getLogger(RestAuthenticationEntryPoint.class);

	private final ObjectMapper objectMapper;
	private final SecurityMetricsService securityMetricsService;

	public RestAuthenticationEntryPoint(ObjectMapper objectMapper, SecurityMetricsService securityMetricsService) {
		this.objectMapper = objectMapper;
		this.securityMetricsService = securityMetricsService;
	}

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException authException) throws IOException {
		securityMetricsService.incrementUnauthenticated();
		String requestId = resolveRequestId(request);

		logger.warn("Unauthenticated request denied. requestId={}, method={}, path={}", requestId, request.getMethod(),
				request.getRequestURI());

		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(objectMapper.writeValueAsString(new SecurityErrorResponse("UNAUTHENTICATED",
				"Authentication is required", requestId, java.time.Instant.now().toString())));
	}

	private String resolveRequestId(HttpServletRequest request) {
		String requestId = request.getHeader("X-Request-Id");
		if (requestId == null || requestId.isBlank()) {
			return UUID.randomUUID().toString();
		}
		return requestId;
	}
}
