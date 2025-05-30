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
    @SuppressWarnings("CallToPrintStackTrace")
    public void updateSubstitutionPlans() {
        System.out.println("===============================================================");
        System.out.println("[SubstitutionPlanService] Starting plan update at " + new java.util.Date());
        long startTime = System.currentTimeMillis();
        
        try {
            // Get fresh timetables from DSB service
            System.out.println("[SubstitutionPlanService] Fetching timetables from DSB service...");
            @SuppressWarnings("unchecked")
            List<TimeTable> timeTables = (List<TimeTable>) dsbService.getTimeTables();
            System.out.println("[SubstitutionPlanService] Received " + timeTables.size() + " timetables from DSB");
            
            // Group timetables by UUID (same UUID = same day plan)
            Map<UUID, List<TimeTable>> timeTablesByUuid = new HashMap<>();
            
            int validTables = 0;
            for (TimeTable table : timeTables) {
                if (table.getDetail() != null && !table.getDetail().isEmpty()) {
                    System.out.println("[SubstitutionPlanService] Found timetable: UUID=" + table.getUUID() + 
                        ", Group=" + table.getGroupName() + ", Detail URL=" + table.getDetail());
                    timeTablesByUuid.computeIfAbsent(table.getUUID(), k -> new ArrayList<>()).add(table);
                    validTables++;
                } else {
                    System.out.println("[SubstitutionPlanService] Skipping timetable with empty detail URL: " + table.getTitle());
                }
            }
            System.out.println("[SubstitutionPlanService] Found " + validTables + " valid timetables in " + 
                timeTablesByUuid.size() + " distinct groups");
            
            List<SubstitutionPlan> combinedPlans = new ArrayList<>();
            
            // Process each group of timetables (each UUID represents one day's plan)
            for (UUID uuid : timeTablesByUuid.keySet()) {
                List<TimeTable> tables = timeTablesByUuid.get(uuid);
                if (tables.isEmpty()) continue;
                
                // All tables in this group should have the same groupName
                String groupName = tables.get(0).getGroupName();
                System.out.println("[SubstitutionPlanService] Processing group: " + groupName + 
                    " with " + tables.size() + " tables (UUID: " + uuid + ")");
                
                // Create a combined plan for this UUID
                SubstitutionPlan combinedPlan = null;
                int totalEntries = 0;
                int totalNewsItems = 0;
                
                for (TimeTable table : tables) {
                    try {
                        System.out.println("[SubstitutionPlanService]   - Processing detail URL: " + table.getDetail());
                        SubstitutionPlan plan = parserService.parseSubstitutionPlanFromUrl(table.getDetail());
                        
                        // Log details about the parsed plan
                        System.out.println("[SubstitutionPlanService]     Date: " + plan.getDate() + 
                            ", Entries: " + plan.getEntries().size() + 
                            ", News items: " + plan.getNews().getNewsItems().size());
                        
                        // For the first plan, initialize the combined plan
                        if (combinedPlan == null) {
                            System.out.println("[SubstitutionPlanService]     Initializing combined plan with first page");
                            combinedPlan = plan;
                            totalEntries = plan.getEntries().size();
                            totalNewsItems = plan.getNews().getNewsItems().size();
                        } else {
                            // For subsequent plans, merge their entries and news into the combined plan
                            System.out.println("[SubstitutionPlanService]     Combining with existing plan");
                            combinedPlan.getEntries().addAll(plan.getEntries());
                            totalEntries += plan.getEntries().size();
                            
                            System.out.println("[SubstitutionPlanService]     Added " + plan.getEntries().size() + 
                                " entries. Total now: " + combinedPlan.getEntries().size());
                            
                            // Merge news items without duplicates
                            int newNewsItems = 0;
                            for (String newsItem : plan.getNews().getNewsItems()) {
                                if (!combinedPlan.getNews().getNewsItems().contains(newsItem)) {
                                    combinedPlan.getNews().addNewsItem(newsItem);
                                    newNewsItems++;
                                    totalNewsItems++;
                                }
                            }
                            System.out.println("[SubstitutionPlanService]     Added " + newNewsItems + 
                                " unique news items. Total now: " + combinedPlan.getNews().getNewsItems().size());
                        }
                    } catch (Exception e) {
                        System.err.println("[SubstitutionPlanService] ERROR parsing plan from URL " + table.getDetail() + 
                            ": " + e.getMessage());
                        e.printStackTrace();
                    }
                }
                
                // Store metadata about the source in the plan for sorting
                if (combinedPlan != null) {
                    // Store the original groupName as metadata for sorting
                    String lowerGroupName = groupName.toLowerCase();
                    boolean isToday = lowerGroupName.contains("heute");
                    boolean isTomorrow = lowerGroupName.contains("morgen");
                    
                    // Set sort priority as a property on the plan (1=today, 2=tomorrow, 3=other)
                    int priority = isToday ? 1 : (isTomorrow ? 2 : 3);
                    combinedPlan.setSortPriority(priority);
                    
                    System.out.println("[SubstitutionPlanService] Finished combined plan for " + groupName + 
                        " (priority " + priority + "): " + 
                        "Date=" + combinedPlan.getDate() + 
                        ", Total entries=" + totalEntries + 
                        ", Total news items=" + totalNewsItems);
                    
                    combinedPlans.add(combinedPlan);
                } else {
                    System.err.println("[SubstitutionPlanService] WARNING: Failed to create combined plan for UUID " + uuid);
                }
            }
            
            System.out.println("[SubstitutionPlanService] Created " + combinedPlans.size() + " combined plans, now sorting...");
            
            // Sort plans by priority (heute first, then morgen, then others)
            // Then by date if available
            combinedPlans.sort(Comparator.comparing(SubstitutionPlan::getSortPriority)
                    .thenComparing((p1, p2) -> {
                        if (p1.getDate() == null && p2.getDate() == null) return 0;
                        if (p1.getDate() == null) return 1;
                        if (p2.getDate() == null) return -1;
                        return p1.getDate().compareTo(p2.getDate());
                    }));
            
            // Log the final sorted order
            System.out.println("[SubstitutionPlanService] Final plan order:");
            for (int i = 0; i < combinedPlans.size(); i++) {
                SubstitutionPlan plan = combinedPlans.get(i);
                System.out.println("[SubstitutionPlanService]   " + (i+1) + ". " + 
                    "Priority=" + plan.getSortPriority() + 
                    ", Date=" + plan.getDate() + 
                    ", Entries=" + plan.getEntries().size());
            }
            
            this.latestPlans = combinedPlans;
            long duration = System.currentTimeMillis() - startTime;
            System.out.println("[SubstitutionPlanService] Updated substitution plans at " + new java.util.Date() + 
                    ", found " + combinedPlans.size() + " plans in " + duration + "ms");
            
        } catch (Exception e) {
            System.err.println("[SubstitutionPlanService] CRITICAL ERROR updating substitution plans: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("===============================================================");
    }

    /**
     * Initialize the plans when the service starts
     */
    @Scheduled(initialDelay = 10000, fixedRate = Long.MAX_VALUE)
    public void initializeSubstitutionPlans() {
        updateSubstitutionPlans();
    }
}
