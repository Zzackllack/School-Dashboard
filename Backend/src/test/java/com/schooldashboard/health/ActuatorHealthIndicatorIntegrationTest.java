package com.schooldashboard.health;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.actuate.health.Health;

public class ActuatorHealthIndicatorIntegrationTest {

	@Test
	public void reportsUpWithRealDataSource() {
		JdbcDataSource dataSource = new JdbcDataSource();
		dataSource.setURL("jdbc:h2:mem:actuator-it;DB_CLOSE_DELAY=-1");
		dataSource.setUser("sa");
		dataSource.setPassword("");

		ActuatorHealthIndicator indicator = new ActuatorHealthIndicator(dataSource, null, "1.0");
		Health health = indicator.health();

		assertEquals("UP", health.getStatus().getCode());
		assertEquals("UP", health.getDetails().get("db"));
		assertNotNull(health.getDetails().get("uptime_ms"));
	}
}
