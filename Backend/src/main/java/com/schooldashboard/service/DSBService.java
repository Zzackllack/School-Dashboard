package com.schooldashboard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.schooldashboard.util.DSBMobile;
import com.schooldashboard.util.DSBMobile.TimeTable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DSBService {

	private static final Logger logger = LoggerFactory.getLogger(DSBService.class);

	private final DsbClient dsbClient;
	private final ApiResponseCacheService cacheService;

	public DSBService(DsbClient dsbClient, ApiResponseCacheService cacheService) {
		this.dsbClient = dsbClient;
		this.cacheService = cacheService;
	}

	@Cacheable("timetables")
	public List<TimeTable> getTimeTables() {
		try {
			List<TimeTable> tables = dsbClient.getTimeTables();
			if (tables != null && !tables.isEmpty()) {
				cacheService.store(ApiResponseCacheKeys.DSB_TIMETABLES, tables);
				return tables;
			}
			return tables == null ? Collections.emptyList() : tables;
		} catch (RuntimeException ex) {
			List<TimeTable> cached = getCachedTimeTables();
			if (!cached.isEmpty()) {
				logger.warn("Failed to fetch timetables, using cached data.", ex);
				return cached;
			}
			logger.warn("Failed to fetch timetables and no cache available.", ex);
			return Collections.emptyList();
		}
	}

	@Cacheable("news")
	public Object getNews() {
		return dsbClient.getNews();
	}

	private List<TimeTable> getCachedTimeTables() {
		Optional<JsonNode> cached = cacheService.getJson(ApiResponseCacheKeys.DSB_TIMETABLES);
		if (cached.isEmpty()) {
			return Collections.emptyList();
		}
		JsonNode node = cached.get();
		if (!node.isArray()) {
			return Collections.emptyList();
		}
		List<TimeTable> tables = new ArrayList<>();
		DSBMobile factory = new DSBMobile("", "");
		for (JsonNode entry : node) {
			String uuidText = readText(entry, "uuid");
			String groupName = readText(entry, "groupName");
			String date = readText(entry, "date");
			String title = readText(entry, "title");
			String detail = readText(entry, "detail");
			if (uuidText == null || groupName == null || date == null || title == null || detail == null) {
				continue;
			}
			try {
				UUID uuid = UUID.fromString(uuidText);
				tables.add(factory.new TimeTable(uuid, groupName, date, title, detail));
			} catch (IllegalArgumentException ex) {
				logger.warn("Skipping cached timetable with invalid UUID: {}", uuidText);
			}
		}
		return tables;
	}

	private String readText(JsonNode node, String field) {
		JsonNode value = node.get(field);
		if (value == null || !value.isTextual()) {
			return null;
		}
		return value.asText();
	}

	@CacheEvict(allEntries = true, value = {"timetables", "news"})
	@Scheduled(fixedRate = 300000) // Clear cache every 5 minutes (300000ms)
	public void clearCache() {
		logger.info("Clearing DSBMobile cache at {}", new java.util.Date());
	}
}
