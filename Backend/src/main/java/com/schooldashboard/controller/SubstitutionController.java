package com.schooldashboard.controller;

import com.schooldashboard.service.ApiResponseCacheKeys;
import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.service.SubstitutionPlanService;
import java.util.List;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/substitution")
public class SubstitutionController {

  private final SubstitutionPlanService substitutionPlanService;
  private final ApiResponseCacheService cacheService;

  public SubstitutionController(
      SubstitutionPlanService substitutionPlanService, ApiResponseCacheService cacheService) {
    this.substitutionPlanService = substitutionPlanService;
    this.cacheService = cacheService;
  }

  @GetMapping("/plans")
  public ResponseEntity<?> getSubstitutionPlans() {
    try {
      List<?> plans = substitutionPlanService.getSubstitutionPlans();
      if (plans == null || plans.isEmpty()) {
        Optional<String> cached = cacheService.getRawJson(ApiResponseCacheKeys.SUBSTITUTION_PLANS);
        if (cached.isPresent()) {
          return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(cached.get());
        }
      }
      return ResponseEntity.ok(plans);
    } catch (Exception e) {
      Optional<String> cached = cacheService.getRawJson(ApiResponseCacheKeys.SUBSTITUTION_PLANS);
      if (cached.isPresent()) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(cached.get());
      }
      return ResponseEntity.badRequest()
          .body("Error fetching substitution plans: " + e.getMessage());
    }
  }
}
