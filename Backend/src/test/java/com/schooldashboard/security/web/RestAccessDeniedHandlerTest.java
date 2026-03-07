package com.schooldashboard.security.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.security.metrics.SecurityMetricsService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;

public class RestAccessDeniedHandlerTest {

	@Test
	public void handleReturnsStructuredForbiddenResponse() throws Exception {
		SecurityMetricsService metricsService = mock(SecurityMetricsService.class);
		RestAccessDeniedHandler deniedHandler = new RestAccessDeniedHandler(new ObjectMapper().findAndRegisterModules(),
				metricsService);

		MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/admin/displays/enrollment-codes");
		request.addHeader("X-Request-Id", "req-2");
		MockHttpServletResponse response = new MockHttpServletResponse();

		deniedHandler.handle(request, response, new AccessDeniedException("forbidden"));

		assertEquals(403, response.getStatus());
		assertTrue(response.getContentAsString().contains("\"code\":\"FORBIDDEN\""));
		assertTrue(response.getContentAsString().contains("\"requestId\":\"req-2\""));
		verify(metricsService).incrementAccessDenied();
	}
}
