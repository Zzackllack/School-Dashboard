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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

	private static final Logger logger = LoggerFactory.getLogger(RestAccessDeniedHandler.class);

	private final ObjectMapper objectMapper;
	private final SecurityMetricsService securityMetricsService;

	public RestAccessDeniedHandler(ObjectMapper objectMapper, SecurityMetricsService securityMetricsService) {
		this.objectMapper = objectMapper;
		this.securityMetricsService = securityMetricsService;
	}

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response,
			AccessDeniedException accessDeniedException) throws IOException {
		securityMetricsService.incrementAccessDenied();
		String requestId = resolveRequestId(request);

		logger.warn("Forbidden request denied. requestId={}, method={}, path={}", requestId, request.getMethod(),
				request.getRequestURI());

		response.setStatus(HttpServletResponse.SC_FORBIDDEN);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(objectMapper.writeValueAsString(new SecurityErrorResponse("FORBIDDEN",
				"You are not allowed to access this resource", requestId, java.time.Instant.now().toString())));
	}

	private String resolveRequestId(HttpServletRequest request) {
		String requestId = request.getHeader("X-Request-Id");
		if (requestId == null || requestId.isBlank()) {
			return UUID.randomUUID().toString();
		}
		return requestId;
	}
}
