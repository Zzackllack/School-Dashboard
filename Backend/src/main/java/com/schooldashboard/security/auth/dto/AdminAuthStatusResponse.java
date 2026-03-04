package com.schooldashboard.security.auth.dto;

import java.util.List;

public record AdminAuthStatusResponse(boolean authenticated, String username, List<String> roles) {
}
