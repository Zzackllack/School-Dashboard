package com.schooldashboard.warning.controller;

import com.schooldashboard.warning.model.WarningSnapshot;
import com.schooldashboard.warning.service.WarningService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/warnings")
public class WarningController {

	private final WarningService warningService;

	public WarningController(WarningService warningService) {
		this.warningService = warningService;
	}

	@GetMapping("/current")
	public ResponseEntity<WarningSnapshot> getCurrentWarnings() {
		return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(warningService.getCurrentSnapshot());
	}
}
