package com.schooldashboard.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
            // Get fresh timetables from DSB service
            List<TimeTable> timeTables = (List<TimeTable>) dsbService.getTimeTables();
            
            // Group timetables by UUID (same UUID = same day plan)
            Map<UUID, List<TimeTable>> timeTablesByUuid = new HashMap<>();
            
            for (TimeTable table : timeTables) {
                if (table.getDetail() != null && !table.getDetail().isEmpty()) {
                    timeTablesByUuid.computeIfAbsent(table.getUUID(), k -> new ArrayList<>()).add(table);
                }
            }
            
            List<SubstitutionPlan> combinedPlans = new ArrayList<>();
            
            // Process each group of timetables (each UUID represents one day's plan)
            for (UUID uuid : timeTablesByUuid.keySet()) {
                List<TimeTable> tables = timeTablesByUuid.get(uuid);
                if (tables.isEmpty()) continue;
                
                // All tables in this group should have the same groupName
                String groupName = tables.get(0).getGroupName();
                
                // Create a combined plan for this UUID
                SubstitutionPlan combinedPlan = null;
                
                for (TimeTable table : tables) {
                    try {
                        SubstitutionPlan plan = parserService.parseSubstitutionPlanFromUrl(table.getDetail());
                        
                        // For the first plan, initialize the combined plan
                        if (combinedPlan == null) {
                            combinedPlan = plan;
                        } else {
                            // For subsequent plans, merge their entries and news into the combined plan
                            combinedPlan.getEntries().addAll(plan.getEntries());
                            
                            // Merge news items without duplicates
                            for (String newsItem : plan.getNews().getNewsItems()) {
                                if (!combinedPlan.getNews().getNewsItems().contains(newsItem)) {
                                    combinedPlan.getNews().addNewsItem(newsItem);
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Error parsing plan from URL " + table.getDetail() + ": " + e.getMessage());
                    }
                }
                
                // Store metadata about the source in the plan for sorting
                if (combinedPlan != null) {
                    // Store the original groupName as metadata for sorting
                    String lowerGroupName = groupName.toLowerCase();
                    boolean isToday = lowerGroupName.contains("heute");
                    boolean isTomorrow = lowerGroupName.contains("morgen");
                    
                    // Set sort priority as a property on the plan (1=today, 2=tomorrow, 3=other)
                    combinedPlan.setSortPriority(isToday ? 1 : (isTomorrow ? 2 : 3));
                    
                    combinedPlans.add(combinedPlan);
                }
            }
            
            // Sort plans by priority (heute first, then morgen, then others)
            // Then by date if available
            combinedPlans.sort(Comparator.comparing(SubstitutionPlan::getSortPriority)
                    .thenComparing((p1, p2) -> {
                        if (p1.getDate() == null && p2.getDate() == null) return 0;
                        if (p1.getDate() == null) return 1;
                        if (p2.getDate() == null) return -1;
                        return p1.getDate().compareTo(p2.getDate());
                    }));
            
            this.latestPlans = combinedPlans;
            System.out.println("Updated substitution plans at " + new java.util.Date() + 
                    ", found " + combinedPlans.size() + " plans");
            
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
