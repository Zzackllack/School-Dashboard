package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

public class DisplayThemeMigrationCoverageTest {

	@Test
	public void h2ThemeMigrationExistsAndAddsThemeColumn() throws Exception {
		assertThemeMigrationContainsThemeId("/db/migration/h2/V11__add_display_theme_id.sql");
	}

	@Test
	public void postgresqlThemeMigrationExistsAndAddsThemeColumn() throws Exception {
		assertThemeMigrationContainsThemeId("/db/migration/postgresql/V11__add_display_theme_id.sql");
	}

	private void assertThemeMigrationContainsThemeId(String resourcePath) throws IOException {
		try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
			assertNotNull(inputStream, () -> "Missing migration resource " + resourcePath);
			String migrationSql = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
			assertTrue(migrationSql.contains("theme_id"),
					() -> "Expected migration to reference theme_id in " + resourcePath);
		}
	}
}
