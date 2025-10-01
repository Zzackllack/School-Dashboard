package com.schooldashboard.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.schooldashboard.model.ParsedPlanDocument;
import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.util.DSBMobile.TimeTable;

@Service
public class SubstitutionPlanService {

    private static final Logger logger = LoggerFactory.getLogger(SubstitutionPlanService.class);

    private final DSBService dsbService;
    private final SubstitutionPlanParserService parserService;
    private final SubstitutionPlanPersistenceService persistenceService;
    private List<SubstitutionPlan> latestPlans = new ArrayList<>();

    @Autowired
    public SubstitutionPlanService(DSBService dsbService, SubstitutionPlanParserService parserService,
            SubstitutionPlanPersistenceService persistenceService) {
        this.dsbService = dsbService;
        this.parserService = parserService;
        this.persistenceService = persistenceService;
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
        logger.info("===============================================================");
        logger.info("[SubstitutionPlanService] Starting plan update at {}", new java.util.Date());
        long startTime = System.currentTimeMillis();
        
        try {
            // Get fresh timetables from DSB service
            logger.info("[SubstitutionPlanService] Fetching timetables from DSB service...");
            @SuppressWarnings("unchecked")
            List<TimeTable> timeTables = (List<TimeTable>) dsbService.getTimeTables();
            logger.info("[SubstitutionPlanService] Received {} timetables from DSB", timeTables.size());
            
            // Group timetables by UUID (same UUID = same day plan)
            Map<UUID, List<TimeTable>> timeTablesByUuid = new HashMap<>();
            
            int validTables = 0;
            for (TimeTable table : timeTables) {
                if (table.getDetail() != null && !table.getDetail().isEmpty()) {
                    logger.info("[SubstitutionPlanService] Found timetable: UUID={} , Group={} , Detail URL={}", table.getUUID(), table.getGroupName(), table.getDetail());
                    timeTablesByUuid.computeIfAbsent(table.getUUID(), k -> new ArrayList<>()).add(table);
                    validTables++;
                } else {
                    logger.info("[SubstitutionPlanService] Skipping timetable with empty detail URL: {}", table.getTitle());
                }
            }
            logger.info("[SubstitutionPlanService] Found {} valid timetables in {} distinct groups", validTables, timeTablesByUuid.size());
            
            List<SubstitutionPlan> combinedPlans = new ArrayList<>();
            
            // Process each group of timetables (each UUID represents one day's plan)
            for (UUID uuid : timeTablesByUuid.keySet()) {
                List<TimeTable> tables = timeTablesByUuid.get(uuid);
                if (tables.isEmpty()) continue;
                
                // All tables in this group should have the same groupName
                String groupName = tables.get(0).getGroupName();
                logger.info("[SubstitutionPlanService] Processing group: {} with {} tables (UUID: {})", groupName, tables.size(), uuid);
                
                // Create a combined plan for this UUID
                SubstitutionPlan combinedPlan = null;
                int totalEntries = 0;
                int totalNewsItems = 0;
                
                for (TimeTable table : tables) {
                    try {
                        logger.info("[SubstitutionPlanService]   - Processing detail URL: {}", table.getDetail());
                        ParsedPlanDocument parsedDocument = parserService.parsePlanDocumentFromUrl(table.getDetail());
                        SubstitutionPlan plan = parsedDocument.getPlan();
                        persistenceService.store(table, plan, parsedDocument.getRawHtml());
                        
                        // Log details about the parsed plan
                        logger.info("[SubstitutionPlanService]     Date: {} , Entries: {} , News items: {}", plan.getDate(), plan.getEntries().size(), plan.getNews().getNewsItems().size());
                        
                        // For the first plan, initialize the combined plan
                        if (combinedPlan == null) {
                            logger.info("[SubstitutionPlanService]     Initializing combined plan with first page");
                            combinedPlan = plan;
                            totalEntries = plan.getEntries().size();
                            totalNewsItems = plan.getNews().getNewsItems().size();
                        } else {
                            // For subsequent plans, merge their entries and news into the combined plan
                            logger.info("[SubstitutionPlanService]     Combining with existing plan");
                            combinedPlan.getEntries().addAll(plan.getEntries());
                            totalEntries += plan.getEntries().size();
                            
                            logger.info("[SubstitutionPlanService]     Added {} entries. Total now: {}", plan.getEntries().size(), combinedPlan.getEntries().size());
                            
                            // Merge news items without duplicates
                            int newNewsItems = 0;
                            for (String newsItem : plan.getNews().getNewsItems()) {
                                if (!combinedPlan.getNews().getNewsItems().contains(newsItem)) {
                                    combinedPlan.getNews().addNewsItem(newsItem);
                                    newNewsItems++;
                                    totalNewsItems++;
                                }
                            }
                            logger.info("[SubstitutionPlanService]     Added {} unique news items. Total now: {}", newNewsItems, combinedPlan.getNews().getNewsItems().size());
                        }
                    } catch (Exception e) {
                        logger.error("[SubstitutionPlanService] ERROR parsing plan from URL {}: {}", table.getDetail(), e.getMessage());
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
                    
                    logger.info("[SubstitutionPlanService] Finished combined plan for {} (priority {}): Date={} , Total entries={} , Total news items={}", groupName, priority, combinedPlan.getDate(), totalEntries, totalNewsItems);
                    
                    combinedPlans.add(combinedPlan);
                } else {
                    logger.error("[SubstitutionPlanService] WARNING: Failed to create combined plan for UUID {}", uuid);
                }
            }
            
            logger.info("[SubstitutionPlanService] Created {} combined plans, now sorting...", combinedPlans.size());
            
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
            logger.info("[SubstitutionPlanService] Final plan order:");
            for (int i = 0; i < combinedPlans.size(); i++) {
                SubstitutionPlan plan = combinedPlans.get(i);
                logger.info("[SubstitutionPlanService]   {}. Priority={} , Date={} , Entries={}", i+1, plan.getSortPriority(), plan.getDate(), plan.getEntries().size());
            }
            
            this.latestPlans = combinedPlans;
            long duration = System.currentTimeMillis() - startTime;
            logger.info("[SubstitutionPlanService] Updated substitution plans at {} , found {} plans in {}ms", new java.util.Date(), combinedPlans.size(), duration);
            
        } catch (Exception e) {
            logger.error("[SubstitutionPlanService] CRITICAL ERROR updating substitution plans: {}", e.getMessage());
            e.printStackTrace();
        }
        logger.info("===============================================================");
    }

    /**
     * Initialize the plans when the service starts
     */
    @Scheduled(initialDelay = 10000, fixedRate = Long.MAX_VALUE)
    public void initializeSubstitutionPlans() {
        updateSubstitutionPlans();
    }
}
