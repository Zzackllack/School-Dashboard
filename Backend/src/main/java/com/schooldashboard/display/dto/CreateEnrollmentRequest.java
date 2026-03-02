package com.schooldashboard.display.dto;

public record CreateEnrollmentRequest(String enrollmentCode, String proposedDisplayName, Object deviceInfo) {
}
