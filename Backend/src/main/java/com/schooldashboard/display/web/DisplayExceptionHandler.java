package com.schooldashboard.display.web;

import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice(basePackages = "com.schooldashboard.display")
public class DisplayExceptionHandler {

	@ExceptionHandler(DisplayDomainException.class)
	public ResponseEntity<DisplayErrorResponse> handleDomainException(DisplayDomainException exception,
			HttpServletRequest request) {
		return ResponseEntity.status(exception.getStatus()).body(new DisplayErrorResponse(exception.getCode(),
				exception.getMessage(), resolveRequestId(request), Instant.now()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<DisplayErrorResponse> handleUnexpectedException(Exception exception,
			HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new DisplayErrorResponse(
				"DISPLAY_INTERNAL_ERROR", "Unexpected display API error", resolveRequestId(request), Instant.now()));
	}

	private String resolveRequestId(HttpServletRequest request) {
		String requestId = request.getHeader("X-Request-Id");
		if (requestId == null || requestId.isBlank()) {
			return UUID.randomUUID().toString();
		}
		return requestId;
	}
}
