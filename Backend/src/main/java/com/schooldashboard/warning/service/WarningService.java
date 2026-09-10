package com.schooldashboard.warning.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.service.ApiResponseCacheKeys;
import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.warning.config.WarningProperties;
import com.schooldashboard.warning.model.WarningNotice;
import com.schooldashboard.warning.model.WarningSnapshot;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class WarningService {

	private static final Logger logger = LoggerFactory.getLogger(WarningService.class);

	private final WarningProperties properties;
	private final WarningSourceClient sourceClient;
	private final ApiResponseCacheService cacheService;
	private final ObjectMapper objectMapper;
	private final AtomicReference<WarningSnapshot> snapshot = new AtomicReference<>(WarningSnapshot.empty());
	private final Map<String, CachedNotice> detailCache = new HashMap<>();

	private WarningSourceClient.SourceCursor cursor;

	public WarningService(WarningProperties properties, WarningSourceClient sourceClient,
			ApiResponseCacheService cacheService, ObjectMapper objectMapper) {
		this.properties = properties;
		this.sourceClient = sourceClient;
		this.cacheService = cacheService;
		this.objectMapper = objectMapper;
	}

	@PostConstruct
	void restoreLastKnownGoodSnapshot() {
		cacheService.getJson(ApiResponseCacheKeys.WARNINGS).ifPresent(json -> {
			try {
				WarningSnapshot cached = objectMapper.treeToValue(json, WarningSnapshot.class);
				snapshot.set(new WarningSnapshot(cached.lastCheckedAt(), cached.lastSuccessfulSyncAt(), false,
						filterExpired(cached.warnings(), Instant.now())));
			} catch (Exception exception) {
				logger.warn("Could not restore cached warning snapshot", exception);
			}
		});
	}

	@Scheduled(fixedDelayString = "${warnings.poll-interval-ms:10000}", initialDelayString = "${warnings.initial-delay-ms:5000}")
	public synchronized void poll() {
		if (!properties.isEnabled()) {
			return;
		}
		if (!properties.isConfigured()) {
			logger.warn("Warning polling is enabled but no warnings.region-code is configured");
			return;
		}

		Instant checkedAt = Instant.now();
		try {
			WarningSourceClient.SourceFetch response = sourceClient.fetchSummaries(cursor);
			cursor = response.cursor();
			if (response.notModified()) {
				WarningSnapshot current = snapshot.get();
				snapshot.set(new WarningSnapshot(checkedAt, current.lastSuccessfulSyncAt(), true,
						filterExpired(current.warnings(), checkedAt)));
				return;
			}

			WarningSnapshot next = buildSnapshot(response.warnings(), checkedAt);
			snapshot.set(next);
			try {
				cacheService.store(ApiResponseCacheKeys.WARNINGS, next);
			} catch (RuntimeException cacheException) {
				logger.warn("Could not persist warning snapshot cache", cacheException);
			}
		} catch (RuntimeException exception) {
			WarningSnapshot current = snapshot.get();
			snapshot.set(new WarningSnapshot(checkedAt, current.lastSuccessfulSyncAt(), false,
					filterExpired(current.warnings(), checkedAt)));
			logger.warn("Warning source refresh failed; retaining last known warning state", exception);
		}
	}

	public WarningSnapshot getCurrentSnapshot() {
		WarningSnapshot current = snapshot.get();
		return new WarningSnapshot(current.lastCheckedAt(), current.lastSuccessfulSyncAt(), current.sourceAvailable(),
				filterExpired(current.warnings(), Instant.now()));
	}

	private WarningSnapshot buildSnapshot(List<WarningSourceClient.SourceWarning> summaries, Instant checkedAt) {
		Set<String> cancelledBaseIds = summaries.stream().filter(this::isCancellation)
				.map(summary -> baseId(summary.id())).collect(Collectors.toSet());
		Map<String, WarningNotice> active = new LinkedHashMap<>();
		active.entrySet().removeIf(entry -> cancelledBaseIds.contains(baseId(entry.getKey())));
		detailCache.keySet().removeIf(id -> cancelledBaseIds.contains(baseId(id)));

		for (WarningSourceClient.SourceWarning summary : summaries.stream().filter(summary -> !isCancellation(summary))
				.filter(summary -> !cancelledBaseIds.contains(baseId(summary.id()))).limit(properties.getMaxWarnings())
				.toList()) {

			CachedNotice cachedNotice = detailCache.get(summary.id());
			WarningNotice notice;
			if (cachedNotice != null && equalsNullable(cachedNotice.hash(), summary.hash())) {
				notice = cachedNotice.notice();
			} else {
				notice = sourceClient.fetchDetails(summary);
				detailCache.put(summary.id(), new CachedNotice(summary.hash(), notice));
			}
			if (notice != null && !notice.isCancellation() && !notice.isExpired(checkedAt)) {
				active.put(notice.id(), notice);
			}
		}
		detailCache.keySet().retainAll(summaries.stream().map(WarningSourceClient.SourceWarning::id).toList());

		List<WarningNotice> warnings = new ArrayList<>(active.values());
		warnings.sort(Comparator.comparingInt((WarningNotice notice) -> severityRank(notice.severity())).reversed()
				.thenComparing(WarningNotice::sentAt, Comparator.nullsLast(Comparator.reverseOrder())));
		return new WarningSnapshot(checkedAt, checkedAt, true, warnings);
	}

	private List<WarningNotice> filterExpired(List<WarningNotice> warnings, Instant now) {
		return warnings.stream().filter(notice -> notice != null && !notice.isCancellation() && !notice.isExpired(now))
				.toList();
	}

	private int severityRank(String severity) {
		if (severity == null) {
			return 0;
		}
		return switch (severity.toLowerCase()) {
			case "extreme" -> 4;
			case "severe" -> 3;
			case "moderate" -> 2;
			case "minor" -> 1;
			default -> 0;
		};
	}

	private String baseId(String id) {
		if (id == null) {
			return "";
		}
		return id.replaceFirst("-\\d{3}$", "");
	}

	private boolean isCancellation(WarningSourceClient.SourceWarning summary) {
		return summary.messageType() != null && "cancel".equalsIgnoreCase(summary.messageType());
	}

	private boolean equalsNullable(String left, String right) {
		return left == null ? right == null : left.equals(right);
	}

	private record CachedNotice(String hash, WarningNotice notice) {
	}
}
