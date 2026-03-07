package com.schooldashboard.security.auth.dto;

public record CsrfTokenResponse(String headerName, String parameterName, String token) {
}
