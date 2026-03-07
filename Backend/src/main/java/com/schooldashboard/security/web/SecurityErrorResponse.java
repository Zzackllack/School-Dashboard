package com.schooldashboard.security.web;

public record SecurityErrorResponse(String code, String message, String requestId, String timestamp) {
}
