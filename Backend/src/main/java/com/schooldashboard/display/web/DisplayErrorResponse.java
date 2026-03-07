package com.schooldashboard.display.web;

import java.time.Instant;

public record DisplayErrorResponse(String code, String message, String requestId, Instant timestamp) {
}
