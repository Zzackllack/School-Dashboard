package com.schooldashboard.security.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.AssertTrue;

public record AdminCredentialUpdateRequest(@NotBlank String currentPassword, String newUsername, String newPassword) {

	@AssertTrue(message = "either newUsername or newPassword must be provided")
	public boolean hasUpdateValue() {
		return (newUsername != null && !newUsername.isBlank()) || (newPassword != null && !newPassword.isBlank());
	}
}
