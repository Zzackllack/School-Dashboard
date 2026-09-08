package com.schooldashboard.service;

import com.schooldashboard.model.ParsedPlanDocument;
import com.schooldashboard.model.PlanParseDiagnostics;
import com.schooldashboard.model.SubstitutionEntry;
import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.util.DSBMobile.TimeTable;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class SubstitutionPlanService {

	private static final Logger logger = LoggerFactory.getLogger(SubstitutionPlanService.class);
	private static final Pattern PAGE_IN_NAME_PATTERN = Pattern.compile("(?i)(?:seite|page)[-_ ]*(\\d+)");
	private static final Pattern TRAILING_PAGE_PATTERN = Pattern.compile("(\\d+)(?=\\.html?(?:$|[?#]))");

	private final DSBService dsbService;
	private final SubstitutionPlanParserService parserService;
	private final SubstitutionPlanPersistenceService persistenceService;
	private final ApiResponseCacheService cacheService;
	private volatile List<SubstitutionPlan> latestPlans = List.of();

	public SubstitutionPlanService(DSBService dsbService, SubstitutionPlanParserService parserService,
			SubstitutionPlanPersistenceService persistenceService, ApiResponseCacheService cacheService) {
		this.dsbService = dsbService;
		this.parserService = parserService;
		this.persistenceService = persistenceService;
		this.cacheService = cacheService;
	}

	/** Gets the latest validated substitution plans. */
	public List<SubstitutionPlan> getSubstitutionPlans() {
		return latestPlans;
	}

	/**
	 * Fetches, validates, and atomically publishes the latest substitution plans.
	 * The scheduled refresh keeps the previous response when any source group is
	 * structurally invalid or incomplete.
	 */
	@Scheduled(fixedRate = 300000)
	@CacheEvict(value = "substitutionPlans", allEntries = true)
	public void updateSubstitutionPlans() {
		long startTime = System.currentTimeMillis();
		logger.info("[SubstitutionPlanService] Starting plan update");

		try {
			List<TimeTable> fetchedTimeTables = dsbService.getTimeTables();
			List<TimeTable> timeTables = fetchedTimeTables == null ? List.of() : fetchedTimeTables;
			Map<UUID, List<TimeTable>> timeTablesByUuid = groupTimetables(timeTables);
			logger.info("[SubstitutionPlanService] Received {} timetables in {} groups", timeTables.size(),
					timeTablesByUuid.size());

			List<SubstitutionPlan> combinedPlans = new ArrayList<>();
			boolean refreshValid = !timeTablesByUuid.isEmpty();
			int invalidGroups = 0;

			for (Map.Entry<UUID, List<TimeTable>> group : sortedGroups(timeTablesByUuid)) {
				PlanGroupResult result = parseGroup(group.getKey(), group.getValue());
				if (result.plan() == null) {
					refreshValid = false;
					invalidGroups++;
					continue;
				}
				combinedPlans.add(result.plan());
			}

			combinedPlans.sort(Comparator.comparing(SubstitutionPlan::getSortPriority)
					.thenComparing(plan -> plan.getDate() == null ? "" : plan.getDate()));

			if (refreshValid && !combinedPlans.isEmpty()) {
				cacheService.store(ApiResponseCacheKeys.SUBSTITUTION_PLANS, combinedPlans);
				latestPlans = List.copyOf(combinedPlans);
				logger.info(
						"[SubstitutionPlanService] Refresh published: timetableDocuments={}, dayGroups={}, "
								+ "validGroups={}, invalidGroups={}, published=true, fallbackUsed=false",
						timeTables.size(), timeTablesByUuid.size(), combinedPlans.size(), invalidGroups);
			} else {
				logger.warn(
						"[SubstitutionPlanService] Refresh withheld: timetableDocuments={}, dayGroups={}, "
								+ "validGroups={}, invalidGroups={}, published=false, fallbackUsed={}",
						timeTables.size(), timeTablesByUuid.size(), combinedPlans.size(), invalidGroups,
						!latestPlans.isEmpty());
			}

			logger.info("[SubstitutionPlanService] Finished plan update in {}ms",
					System.currentTimeMillis() - startTime);
		} catch (Exception e) {
			logger.error("[SubstitutionPlanService] Refresh failed; keeping the last validated plans: {}",
					e.getMessage(), e);
		}
	}

	private Map<UUID, List<TimeTable>> groupTimetables(List<TimeTable> timeTables) {
		Map<UUID, List<TimeTable>> grouped = new HashMap<>();
		for (TimeTable table : timeTables == null ? List.<TimeTable>of() : timeTables) {
			if (table == null || table.getUUID() == null || table.getDetail() == null || table.getDetail().isBlank()) {
				logger.warn("[SubstitutionPlanService] Skipping timetable without a usable detail page");
				continue;
			}
			grouped.computeIfAbsent(table.getUUID(), ignored -> new ArrayList<>()).add(table);
		}
		return grouped;
	}

	private List<Map.Entry<UUID, List<TimeTable>>> sortedGroups(Map<UUID, List<TimeTable>> groups) {
		return groups.entrySet().stream()
				.sorted(Comparator
						.comparing((Map.Entry<UUID, List<TimeTable>> entry) -> groupPriority(entry.getValue()))
						.thenComparing(entry -> entry.getKey().toString()))
				.toList();
	}

	private int groupPriority(List<TimeTable> tables) {
		String groupName = tables.isEmpty() ? "" : tables.get(0).getGroupName();
		String lowerGroupName = groupName == null ? "" : groupName.toLowerCase(Locale.ROOT);
		return lowerGroupName.contains("heute") ? 1 : lowerGroupName.contains("morgen") ? 2 : 3;
	}

	private PlanGroupResult parseGroup(UUID uuid, List<TimeTable> unsortedTables) {
		List<TimeTable> tables = unsortedTables.stream()
				.sorted(Comparator.comparing(this::pageNumber, Comparator.nullsLast(Comparator.naturalOrder()))
						.thenComparing(table -> safePageLabel(table.getDetail())))
				.toList();
		List<ParsedPage> pages = new ArrayList<>();

		for (TimeTable table : tables) {
			try {
				ParsedPlanDocument parsedDocument = parserService.parsePlanDocumentFromUrl(table.getDetail());
				if (parsedDocument == null || parsedDocument.getPlan() == null
						|| parsedDocument.getDiagnostics() == null || !isSemanticallyPublishable(parsedDocument)) {
					logger.warn("[SubstitutionPlanService] Withholding group {} because page {} is unsupported", uuid,
							safePageLabel(table.getDetail()));
					return new PlanGroupResult(null);
				}
				pages.add(new ParsedPage(table, parsedDocument));
			} catch (RuntimeException e) {
				logger.warn("[SubstitutionPlanService] Withholding group {} because page {} failed: {}", uuid,
						safePageLabel(table.getDetail()), e.getMessage());
				return new PlanGroupResult(null);
			}
		}

		if (!hasCompletePageSet(pages)) {
			logger.warn("[SubstitutionPlanService] Withholding incomplete page group {}", uuid);
			return new PlanGroupResult(null);
		}

		SubstitutionPlan combinedPlan = pages.get(0).document().getPlan();
		for (int i = 1; i < pages.size(); i++) {
			SubstitutionPlan pagePlan = pages.get(i).document().getPlan();
			combinedPlan.getEntries().addAll(pagePlan.getEntries());
			for (String newsItem : pagePlan.getNews().getNewsItems()) {
				if (!combinedPlan.getNews().getNewsItems().contains(newsItem)) {
					combinedPlan.getNews().addNewsItem(newsItem);
				}
			}
		}

		String groupName = tables.get(0).getGroupName();
		combinedPlan.setSortPriority(groupPriority(tables));
		for (ParsedPage page : pages) {
			try {
				persistenceService.store(page.table(), page.document().getPlan(), page.document().getRawHtml());
			} catch (RuntimeException e) {
				// Persistence is forensic history, not the publication boundary.
				logger.warn("[SubstitutionPlanService] Could not persist page {} for group {}: {}",
						safePageLabel(page.table().getDetail()), uuid, e.getMessage());
			}
		}
		logger.info("[SubstitutionPlanService] Published candidate group={} name={} pages={} entries={}", uuid,
				groupName, pages.size(), combinedPlan.getEntries().size());
		return new PlanGroupResult(combinedPlan);
	}

	private boolean hasCompletePageSet(List<ParsedPage> pages) {
		if (pages.isEmpty()) {
			return false;
		}
		Integer expectedPageCount = null;
		List<Integer> pageNumbers = new ArrayList<>();
		for (ParsedPage page : pages) {
			PlanParseDiagnostics diagnostics = page.document().getDiagnostics();
			if (diagnostics.getPageCount() != null || diagnostics.getPageNumber() != null) {
				if (diagnostics.getPageCount() == null || diagnostics.getPageNumber() == null) {
					return false;
				}
				if (expectedPageCount == null) {
					expectedPageCount = diagnostics.getPageCount();
				} else if (!expectedPageCount.equals(diagnostics.getPageCount())) {
					return false;
				}
				pageNumbers.add(diagnostics.getPageNumber());
			}
		}
		if (expectedPageCount == null) {
			return true;
		}
		if (pages.size() != expectedPageCount || pageNumbers.size() != expectedPageCount) {
			return false;
		}
		pageNumbers.sort(Comparator.naturalOrder());
		for (int i = 0; i < pageNumbers.size(); i++) {
			if (pageNumbers.get(i) != i + 1) {
				return false;
			}
		}
		return true;
	}

	private boolean isSemanticallyPublishable(ParsedPlanDocument parsedDocument) {
		PlanParseDiagnostics diagnostics = parsedDocument.getDiagnostics();
		SubstitutionPlan plan = parsedDocument.getPlan();
		if (!diagnostics.isPublishable() || plan.getEntries() == null) {
			return false;
		}
		if (diagnostics.getStatus() == PlanParseDiagnostics.Status.EMPTY) {
			return plan.getEntries().isEmpty();
		}
		return !plan.getEntries().isEmpty() && plan.getEntries().stream().allMatch(this::isMeaningfulEntry)
				&& (diagnostics.getValidEntries() == 0 || diagnostics.getValidEntries() == plan.getEntries().size());
	}

	private boolean isMeaningfulEntry(SubstitutionEntry entry) {
		if (entry == null || !hasVisibleValue(entry.getClasses())) {
			return false;
		}
		return Stream
				.of(entry.getPeriod(), entry.getAbsent(), entry.getSubstitute(), entry.getOriginalSubject(),
						entry.getSubject(), entry.getNewRoom(), entry.getType(), entry.getComment())
				.anyMatch(this::hasVisibleValue);
	}

	private boolean hasVisibleValue(String value) {
		return value != null && !value.isBlank() && !value.trim().equals("---");
	}

	private Integer pageNumber(TimeTable table) {
		String detail = table == null ? null : table.getDetail();
		if (detail == null) {
			return null;
		}
		String fileName = safePageLabel(detail);
		Matcher named = PAGE_IN_NAME_PATTERN.matcher(fileName);
		if (named.find()) {
			return parseInt(named.group(1));
		}
		Matcher trailing = TRAILING_PAGE_PATTERN.matcher(fileName);
		return trailing.find() ? parseInt(trailing.group(1)) : null;
	}

	private String safePageLabel(String detailUrl) {
		if (detailUrl == null || detailUrl.isBlank()) {
			return "unknown-" + shortHash("");
		}
		try {
			String path = URI.create(detailUrl).getPath();
			if (path != null && !path.isBlank()) {
				int slash = path.lastIndexOf('/');
				return path.substring(slash + 1).isBlank() ? "page-" + shortHash(detailUrl) : path.substring(slash + 1);
			}
		} catch (IllegalArgumentException ignored) {
			// Fall through to a non-reversible label for malformed test URLs.
		}
		return "page-" + shortHash(detailUrl);
	}

	private String shortHash(String value) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
			StringBuilder result = new StringBuilder(12);
			for (int i = 0; i < 6; i++) {
				result.append(String.format("%02x", digest[i]));
			}
			return result.toString();
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 algorithm is not available", e);
		}
	}

	private Integer parseInt(String value) {
		try {
			return Integer.valueOf(value);
		} catch (NumberFormatException e) {
			return null;
		}
	}

	@Scheduled(initialDelay = 10000, fixedRate = Long.MAX_VALUE)
	public void initializeSubstitutionPlans() {
		updateSubstitutionPlans();
	}

	private record ParsedPage(TimeTable table, ParsedPlanDocument document) {
	}

	private record PlanGroupResult(SubstitutionPlan plan) {
	}
}
