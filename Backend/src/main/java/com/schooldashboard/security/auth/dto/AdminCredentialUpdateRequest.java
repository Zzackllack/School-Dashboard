package com.schooldashboard.security.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminCredentialUpdateRequest(@NotBlank String currentPassword, String newUsername, String newPassword) {
}
