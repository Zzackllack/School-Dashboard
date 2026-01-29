package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.model.DailyNews;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false", "dsb.username=foo", "dsb.password=bar"})
public class DailyNewsIntegrationTest {

	private static final String DB_URL = "jdbc:h2:mem:daily-news-it-" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1";

	@Autowired
	private ApiResponseCacheService cacheService;

	@Autowired
	private ObjectMapper objectMapper;

	@DynamicPropertySource
	static void registerProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> DB_URL);
	}

	@Test
	public void storesAndReadsDailyNewsJson() throws Exception {
		DailyNews news = new DailyNews("2024-01-01");
		news.addNewsItem("First");
		news.addNewsItem("   ");

		cacheService.store("test/daily-news", news);

		String json = cacheService.getRawJson("test/daily-news").orElse(null);
		assertNotNull(json);

		JsonNode node = objectMapper.readTree(json);
		assertEquals("2024-01-01", node.get("date").asText());
		assertEquals(1, node.get("newsItems").size());
		assertEquals("First", node.get("newsItems").get(0).asText());
	}
}
