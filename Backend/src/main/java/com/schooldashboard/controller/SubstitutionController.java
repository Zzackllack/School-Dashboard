package com.schooldashboard.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.service.DSBService;
import com.schooldashboard.service.SubstitutionPlanParserService;
import com.schooldashboard.util.DSBMobile.TimeTable;

@RestController
@RequestMapping("/api/substitution")
public class SubstitutionController {

    private final DSBService dsbService;
    private final SubstitutionPlanParserService parserService;

    @Autowired
    public SubstitutionController(DSBService dsbService, SubstitutionPlanParserService parserService) {
        this.dsbService = dsbService;
        this.parserService = parserService;
    }

    @GetMapping("/plans")
    @Cacheable("substitutionPlans")
    public ResponseEntity<?> getSubstitutionPlans() {
        try {
            List<SubstitutionPlan> plans = new ArrayList<>();
            
            // Get timetables from DSB service
            List<TimeTable> timeTables = (List<TimeTable>) dsbService.getTimeTables();
            
            // For each timetable with a detail URL, parse the HTML
            for (TimeTable timeTable : timeTables) {
                if (timeTable.getDetail() != null && !timeTable.getDetail().isEmpty()) {
                    try {
                        SubstitutionPlan plan = parserService.parseSubstitutionPlanFromUrl(timeTable.getDetail());
                        plans.add(plan);
                    } catch (Exception e) {
                        System.err.println("Error parsing plan from URL " + timeTable.getDetail() + ": " + e.getMessage());
                    }
                }
            }
            
            return ResponseEntity.ok(plans);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching substitution plans: " + e.getMessage());
        }
    }
}
