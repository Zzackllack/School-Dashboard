package com.schooldashboard.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.util.DSBMobile.TimeTable;

@Service
public class SubstitutionPlanService {

    private final DSBService dsbService;
    private final SubstitutionPlanParserService parserService;
    private List<SubstitutionPlan> latestPlans = new ArrayList<>();

    @Autowired
    public SubstitutionPlanService(DSBService dsbService, SubstitutionPlanParserService parserService) {
        this.dsbService = dsbService;
        this.parserService = parserService;
    }

    /**
     * Gets the latest substitution plans, either from cache or by fetching them
     */
    public List<SubstitutionPlan> getSubstitutionPlans() {
        return latestPlans;
    }

    /**
     * Fetches the latest substitution plans from the DSB service and parses them
     * This method is scheduled to run every 5 minutes and evicts the cache
     */
    @Scheduled(fixedRate = 300000) // Run every 5 minutes (300000 ms)
    @CacheEvict(value = "substitutionPlans", allEntries = true)
    public void updateSubstitutionPlans() {
        try {
            List<SubstitutionPlan> plans = new ArrayList<>();
            
            // Get fresh timetables from DSB service
            // This will bypass the cache because we call the method directly on dsbService
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
            
            this.latestPlans = plans;
            System.out.println("Updated substitution plans at " + new java.util.Date());
        } catch (Exception e) {
            System.err.println("Error updating substitution plans: " + e.getMessage());
        }
    }

    /**
     * Initialize the plans when the service starts
     */
    @Scheduled(initialDelay = 10000, fixedRate = Long.MAX_VALUE)
    public void initializeSubstitutionPlans() {
        updateSubstitutionPlans();
    }
}
