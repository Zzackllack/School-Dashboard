package com.schooldashboard.controller;

import com.schooldashboard.service.ApiResponseCacheKeys;
import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.service.DSBService;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dsb")
public class DSBController {

	private final DSBService dsbService;
	private final ApiResponseCacheService cacheService;

	public DSBController(DSBService dsbService, ApiResponseCacheService cacheService) {
		this.dsbService = dsbService;
		this.cacheService = cacheService;
	}

	@GetMapping("/timetables")
	public ResponseEntity<?> getTimeTables() {
		try {
			return ResponseEntity.ok(dsbService.getTimeTables());
		} catch (Exception e) {
			Optional<String> cached = cacheService.getRawJson(ApiResponseCacheKeys.DSB_TIMETABLES);
			if (cached.isPresent()) {
				return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(cached.get());
			}
			return ResponseEntity.badRequest().body("Error fetching timetables: " + e.getMessage());
		}
	}

	@GetMapping("/news")
	public ResponseEntity<?> getNews() {
		try {
			return ResponseEntity.ok(dsbService.getNews());
		} catch (Exception e) {
			return ResponseEntity.badRequest().body("Error fetching news: " + e.getMessage());
		}
	}
}
