package com.schooldashboard.health;

import java.lang.management.ManagementFactory;
import java.sql.Connection;
import java.sql.Statement;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.cache.CacheManager;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

@Component("applicationHealth")
public class ActuatorHealthIndicator implements HealthIndicator {

	private final DataSource dataSource;
	private final CacheManager cacheManager;
	private final String appVersion;

	public ActuatorHealthIndicator(@Nullable DataSource dataSource, @Nullable CacheManager cacheManager,
			@Value("${app.version:unknown}") String appVersion) {
		this.dataSource = dataSource;
		this.cacheManager = cacheManager;
		this.appVersion = appVersion;
	}

	@Override
	public Health health() {
		Map<String, Object> details = new LinkedHashMap<>();
		details.put("version", appVersion);

		// DB check
		if (dataSource != null) {
			try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
				s.executeQuery("SELECT 1");
				details.put("db", "UP");
			} catch (Exception e) {
				details.put("db", "DOWN");
				details.put("dbError", e.getMessage());
				if (cacheManager != null) {
					details.put("caches", cacheManager.getCacheNames());
				} else {
					details.put("caches", "NOT CONFIGURED");
				}
				long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
				details.put("uptime_ms", uptimeMs);
				return Health.down().withDetails(details).build();
			}
		} else {
			details.put("db", "NOT CONFIGURED");
		}

		// Cache info
		if (cacheManager != null) {
			details.put("caches", cacheManager.getCacheNames());
		} else {
			details.put("caches", "NOT CONFIGURED");
		}

		// Uptime
		long uptimeMs = ManagementFactory.getRuntimeMXBean().getUptime();
		details.put("uptime_ms", uptimeMs);

		return Health.up().withDetails(details).build();
	}
}
