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
import org.springframework.security.authentication.InsufficientAuthenticationException;

public class RestAuthenticationEntryPointTest {

	@Test
	public void commenceReturnsStructuredUnauthorizedResponse() throws Exception {
		SecurityMetricsService metricsService = mock(SecurityMetricsService.class);
		RestAuthenticationEntryPoint entryPoint = new RestAuthenticationEntryPoint(
				new ObjectMapper().findAndRegisterModules(), metricsService);

		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/displays");
		request.addHeader("X-Request-Id", "req-1");
		MockHttpServletResponse response = new MockHttpServletResponse();

		entryPoint.commence(request, response, new InsufficientAuthenticationException("no auth"));

		assertEquals(401, response.getStatus());
		assertTrue(response.getContentAsString().contains("\"code\":\"UNAUTHENTICATED\""));
		assertTrue(response.getContentAsString().contains("\"requestId\":\"req-1\""));
		verify(metricsService).incrementUnauthenticated();
	}
}
