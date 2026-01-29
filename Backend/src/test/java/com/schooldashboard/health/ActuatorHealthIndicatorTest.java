package com.schooldashboard.health;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;
import org.springframework.cache.CacheManager;

public class ActuatorHealthIndicatorTest {

	@Test
	public void reportsDownWhenDataSourceFails() throws Exception {
		DataSource dataSource = mock(DataSource.class);
		when(dataSource.getConnection()).thenThrow(new SQLException("offline"));

		ActuatorHealthIndicator indicator = new ActuatorHealthIndicator(dataSource, null, "1.0");
		Health health = indicator.health();

		assertEquals("DOWN", health.getStatus().getCode());
		assertEquals("DOWN", health.getDetails().get("db"));
		assertNotNull(health.getDetails().get("dbError"));
		assertEquals("NOT CONFIGURED", health.getDetails().get("caches"));
		assertNotNull(health.getDetails().get("uptime_ms"));
	}

	@Test
	public void reportsUpWithDataSourceAndCache() throws Exception {
		DataSource dataSource = mock(DataSource.class);
		Connection connection = mock(Connection.class);
		Statement statement = mock(Statement.class);
		when(dataSource.getConnection()).thenReturn(connection);
		when(connection.createStatement()).thenReturn(statement);

		CacheManager cacheManager = mock(CacheManager.class);
		when(cacheManager.getCacheNames()).thenReturn(java.util.List.of("plans"));

		ActuatorHealthIndicator indicator = new ActuatorHealthIndicator(dataSource, cacheManager, "2.0");
		Health health = indicator.health();

		assertEquals("UP", health.getStatus().getCode());
		assertEquals("UP", health.getDetails().get("db"));
		assertEquals(java.util.List.of("plans"), health.getDetails().get("caches"));
		assertNotNull(health.getDetails().get("uptime_ms"));
		verify(statement).executeQuery("SELECT 1");
	}

	@Test
	public void reportsNotConfiguredWhenNoDependencies() {
		ActuatorHealthIndicator indicator = new ActuatorHealthIndicator(null, null, "unknown");
		Health health = indicator.health();

		assertEquals("UP", health.getStatus().getCode());
		assertEquals("NOT CONFIGURED", health.getDetails().get("db"));
		assertEquals("NOT CONFIGURED", health.getDetails().get("caches"));
		assertNotNull(health.getDetails().get("uptime_ms"));
	}
}
