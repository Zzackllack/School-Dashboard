package com.schooldashboard.survey.web;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(basePackages = "com.schooldashboard.survey")
public class SurveyExceptionHandler {

	@ExceptionHandler(SurveyDomainException.class)
	public ResponseEntity<SurveyErrorResponse> handleDomainException(SurveyDomainException exception,
			HttpServletRequest request) {
		return ResponseEntity.status(exception.getStatus()).body(new SurveyErrorResponse(exception.getCode(),
				exception.getMessage(), resolveRequestId(request), Instant.now()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<SurveyErrorResponse> handleValidationException(MethodArgumentNotValidException exception,
			HttpServletRequest request) {
		String message = exception.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage)
				.filter(value -> value != null && !value.isBlank()).collect(Collectors.joining("; "));
		if (message.isBlank()) {
			message = "Ungültige Anfrage";
		}
		return ResponseEntity.badRequest().body(new SurveyErrorResponse("SURVEY_VALIDATION_ERROR", message,
				resolveRequestId(request), Instant.now()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<SurveyErrorResponse> handleUnexpectedException(Exception exception,
			HttpServletRequest request) {
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new SurveyErrorResponse(
				"SURVEY_INTERNAL_ERROR", "Unexpected survey API error", resolveRequestId(request), Instant.now()));
	}

	private String resolveRequestId(HttpServletRequest request) {
		String requestId = request.getHeader("X-Request-Id");
		if (requestId == null || requestId.isBlank()) {
			return UUID.randomUUID().toString();
		}
		return requestId;
	}
}
