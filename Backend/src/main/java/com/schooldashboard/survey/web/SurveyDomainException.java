package com.schooldashboard.survey.web;

import org.springframework.http.HttpStatus;

public class SurveyDomainException extends RuntimeException {

	private final String code;
	private final HttpStatus status;

	public SurveyDomainException(String code, HttpStatus status, String message) {
		super(message);
		this.code = code;
		this.status = status;
	}

	public String getCode() {
		return code;
	}

	public HttpStatus getStatus() {
		return status;
	}
}
