package com.schooldashboard.display.dto;

import jakarta.validation.constraints.Size;

public record DeviceInfoDto(@Size(max = 120) String deviceId, @Size(max = 80) String deviceType,
		@Size(max = 80) String osVersion, @Size(max = 255) String userAgent, @Size(max = 80) String appVersion,
		@Size(max = 16) String language, @Size(max = 80) String platform) {
}
