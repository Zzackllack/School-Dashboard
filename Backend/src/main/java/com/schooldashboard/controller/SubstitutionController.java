package com.schooldashboard.controller;

import com.schooldashboard.service.SubstitutionPlanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/substitution")
public class SubstitutionController {

    private final SubstitutionPlanService substitutionPlanService;

    public SubstitutionController(SubstitutionPlanService substitutionPlanService) {
        this.substitutionPlanService = substitutionPlanService;
    }

    @GetMapping("/plans")
    public ResponseEntity<?> getSubstitutionPlans() {
        try {
            return ResponseEntity.ok(substitutionPlanService.getSubstitutionPlans());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching substitution plans: " + e.getMessage());
        }
    }
}
