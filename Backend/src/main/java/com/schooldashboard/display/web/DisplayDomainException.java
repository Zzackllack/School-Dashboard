package com.schooldashboard.display.web;

import org.springframework.http.HttpStatus;

public class DisplayDomainException extends RuntimeException {

	private final String code;
	private final HttpStatus status;

	public DisplayDomainException(String code, HttpStatus status, String message) {
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
